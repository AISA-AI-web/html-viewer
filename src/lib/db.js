import { supabase } from './supabase'

// Columns safe to list without pulling the (potentially large) html blob.
const LIST_COLUMNS =
  'id, title, description, grade_level, subject, concepts, standards, author_id, ' +
  'avg_rating, rating_count, view_count, created_at'

// Browse the library with optional filters. Returns lightweight rows (no html).
export async function listSimulations({ search, grade, subject, sort = 'created_at' } = {}) {
  let q = supabase.from('simulations').select(LIST_COLUMNS).eq('is_published', true)

  if (grade) q = q.eq('grade_level', grade)
  if (subject) q = q.eq('subject', subject)
  if (search && search.trim()) {
    // Strip everything except word chars/space/hyphen so user input can't inject
    // PostgREST filter syntax (',' '.' '()' ':') or LIKE wildcards ('%' '_').
    const term = search.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
  }

  q = sort === 'rating'
    ? q.order('avg_rating', { ascending: false }).order('rating_count', { ascending: false })
    : sort === 'views'
      ? q.order('view_count', { ascending: false })
      : q.order('created_at', { ascending: false })

  const { data, error } = await q.limit(200)
  if (error) throw error
  return data
}

// Full record including html (for the viewer / editor).
export async function getSimulation(id) {
  const { data, error } = await supabase.from('simulations').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function getMySimulations(userId) {
  const { data, error } = await supabase
    .from('simulations')
    .select(LIST_COLUMNS + ', is_published')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createSimulation(payload) {
  const { data, error } = await supabase.from('simulations').insert(payload).select('id').single()
  if (error) throw error
  return data.id
}

export async function updateSimulation(id, payload) {
  // .select() so we can detect a zero-row update — PostgREST returns no error
  // when RLS filters the row out, which would otherwise look like success.
  const { data, error } = await supabase.from('simulations').update(payload).eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error("Couldn't save — you may not have permission to edit this simulation.")
  }
}

export async function deleteSimulation(id) {
  const { data, error } = await supabase.from('simulations').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error("Couldn't delete — you may not have permission, or it no longer exists.")
  }
}

export async function incrementView(id) {
  // Fire-and-forget; a failed view count must never block rendering a sim.
  await supabase.rpc('increment_view', { sim_id: id }).then(() => {}, () => {})
}

// Author display names for a set of author ids → { id: name }.
export async function getAuthorNames(ids) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return {}
  const { data, error } = await supabase.from('profiles').select('id, display_name').in('id', unique)
  if (error) return {}
  return Object.fromEntries(data.map((p) => [p.id, p.display_name]))
}

// Just the rating aggregates — avoids re-downloading the html blob after a vote.
export async function getSimulationStats(id) {
  const { data } = await supabase
    .from('simulations')
    .select('avg_rating, rating_count')
    .eq('id', id)
    .single()
  return data
}

export async function getMyRating(simulationId, userId) {
  if (!userId) return null
  const { data } = await supabase
    .from('ratings')
    .select('rating')
    .eq('simulation_id', simulationId)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.rating ?? null
}

export async function rateSimulation(simulationId, userId, rating) {
  const { error } = await supabase
    .from('ratings')
    .upsert({ simulation_id: simulationId, user_id: userId, rating }, { onConflict: 'simulation_id,user_id' })
  if (error) throw error
}

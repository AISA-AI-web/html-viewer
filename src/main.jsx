import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth.jsx'
import { bootstrapAuth } from './lib/authBootstrap.js'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Editor from './pages/Editor.jsx'
import Viewer from './pages/Viewer.jsx'
import Login from './pages/Login.jsx'
import MySims from './pages/MySims.jsx'
import NotFound from './pages/NotFound.jsx'

// Complete any sign-in redirect (exchange ?code= for a session) BEFORE the
// router mounts, so the session is ready and any failure is surfaced to the UI.
// Top-level await is valid in a Vite ESM entry module.
const { error: authError } = await bootstrapAuth()

// HashRouter keeps all routing in the URL fragment, so it works on GitHub Pages
// with no server-side rewrite. Sim links look like .../#/sim/<id>.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider initialAuthError={authError}>
      <HashRouter>
        <Routes>
          {/* Full-screen viewer renders outside the app chrome. */}
          <Route path="/sim/:id" element={<Viewer />} />
          <Route element={<App />}>
            <Route index element={<Home />} />
            <Route path="new" element={<Editor />} />
            <Route path="edit/:id" element={<Editor />} />
            <Route path="me" element={<MySims />} />
            <Route path="login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  </StrictMode>,
)

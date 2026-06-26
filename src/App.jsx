import { Outlet } from 'react-router-dom'
import Nav from './components/Nav.jsx'

// App chrome shared by all non-fullscreen routes.
export default function App() {
  return (
    <div className="app">
      <Nav />
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>EduSim Hub — interactive simulations built by teachers, for teachers.</span>
      </footer>
    </div>
  )
}

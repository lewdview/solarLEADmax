import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LeadsList from './pages/LeadsList'
import LeadDetail from './pages/LeadDetail'

function NavBar() {
  const { pathname } = useLocation()
  const active = (path: string) => pathname === path ? 'text-blue-600' : 'text-gray-600'
  return (
    <nav className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <div className="font-semibold">solarLEADmax</div>
        <Link className={`hover:text-blue-600 ${active('/')}`} to="/">Dashboard</Link>
        <Link className={`hover:text-blue-600 ${active('/leads')}`} to="/leads">Leads</Link>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadsList />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
        </Routes>
      </main>
    </div>
  )
}

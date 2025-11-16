import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import LeadsList from './pages/LeadsList'
import LeadDetail from './pages/LeadDetail'

function NavBar() {
  const { pathname } = useLocation()
  const active = (path: string) => 
    pathname === path 
      ? 'text-white font-semibold' 
      : 'text-white/80 hover:text-white'
  
  return (
    <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 sticky top-0 z-10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌞</span>
          <span className="font-bold text-white text-xl">solarLEADmax</span>
        </div>
        <div className="flex gap-6 ml-auto">
          <Link className={`transition-colors ${active('/')}`} to="/">Dashboard</Link>
          <Link className={`transition-colors ${active('/leads')}`} to="/leads">Leads</Link>
        </div>
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <NavBar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<LeadsList />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
        </Routes>
      </main>
    </div>
  )
}

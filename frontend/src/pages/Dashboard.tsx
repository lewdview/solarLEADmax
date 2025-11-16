import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadApi, demoApi } from '../lib/api'

const statuses: { key: string; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'from-blue-500 to-cyan-500' },
  { key: 'contacted', label: 'Contacted', color: 'from-purple-500 to-pink-500' },
  { key: 'qualified', label: 'Qualified', color: 'from-green-500 to-emerald-500' },
  { key: 'appointment_set', label: 'Booked', color: 'from-orange-500 to-amber-500' },
  { key: 'dead', label: 'Dead', color: 'from-gray-500 to-slate-500' },
]

function DemoLeadForm() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const mutation = useMutation({
    mutationFn: demoApi.createLead,
    onSuccess: (data) => {
      setMessage({ type: 'success', text: `Lead created! ID: ${data.lead_id}` })
      setName('')
      setPhone('')
      setEmail('')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      setTimeout(() => setMessage(null), 5000)
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.response?.data?.error?.message || 'Failed to create lead' })
      setTimeout(() => setMessage(null), 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ name, phone, email: email || undefined })
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌟</span>
        <h2 className="text-xl font-semibold">Create Demo Lead</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Full Name *"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="Phone Number *"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? 'Creating...' : 'Create Demo Lead'}
        </button>
        {message && (
          <div className={`p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-300' 
              : 'bg-red-500/20 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}
      </form>
    </div>
  )
}

export default function Dashboard() {
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadApi.list(),
  })

  const counts = leads.reduce((acc: Record<string, number>, l: any) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  const recent = [...leads].sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Dashboard</h1>
        <div className="text-sm text-gray-600">Total Leads: {leads.length}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statuses.map(s => (
            <div key={s.key} className={`rounded-xl bg-gradient-to-br ${s.color} p-5 shadow-lg text-white transform hover:scale-105 transition-transform`}>
              <div className="text-sm opacity-90 mb-1">{s.label}</div>
              <div className="text-3xl font-bold">{counts[s.key] || 0}</div>
            </div>
          ))}
        </div>
        <div>
          <DemoLeadForm />
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 font-semibold text-lg border-b bg-gradient-to-r from-purple-50 to-indigo-50">Recent Leads</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Phone</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Score</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={5}>Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td className="px-6 py-8 text-center" colSpan={5}>
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <span className="text-4xl">📋</span>
                    <p>No leads yet. Create a demo lead above!</p>
                  </div>
                </td></tr>
              ) : recent.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-purple-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <a className="text-purple-600 hover:text-purple-800 font-medium hover:underline" href={`/leads/${l.id}`}>{l.name}</a>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{l.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {l.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{l.interest_score ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

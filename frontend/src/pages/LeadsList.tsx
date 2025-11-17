import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leadApi } from '../lib/api'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'appointment_set', label: 'Booked' },
  { value: 'dead', label: 'Dead' },
]

export default function LeadsList() {
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')

  const qc = useQueryClient()
  const createMut = useMutation({
    mutationFn: (data: any) => leadApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', status],
    queryFn: () => leadApi.list(status ? { status } : undefined),
  })

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return leads
    return leads.filter((l: any) =>
      (l.name || '').toLowerCase().includes(term) ||
      (l.phone || '').toLowerCase().includes(term) ||
      (l.email || '').toLowerCase().includes(term)
    )
  }, [leads, q])

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload: any = {
      name: fd.get('name') || '',
      phone: fd.get('phone') || undefined,
      email: fd.get('email') || undefined,
      address: fd.get('address') || '',
      source: fd.get('source') || 'manual',
    }
    const mb = fd.get('monthly_bill') as string
    if (mb) payload.monthly_bill = Number(mb)
    createMut.mutate(payload)
    e.currentTarget.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">All Leads</h1>
        <div className="text-sm text-gray-600">{filtered.length} {filtered.length === 1 ? 'lead' : 'leads'}</div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Search name, phone, or email..." 
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)} 
            className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none bg-white transition-colors"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">⚡</span>
          <div className="font-semibold text-lg">Quick Create Lead</div>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required name="name" placeholder="Full Name" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input name="phone" placeholder="Phone (+1...)" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input name="email" type="email" placeholder="Email Address" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <input required name="address" placeholder="Street Address, City, State" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 md:col-span-2" />
          <input name="source" placeholder="Source" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50" defaultValue="website" />
          <input name="monthly_bill" type="number" min={0} placeholder="Monthly Bill ($)" className="px-4 py-2.5 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50" />
          <div className="md:col-span-3">
            <button type="submit" className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-white text-purple-600 font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
        {createMut.error && <div className="mt-3 p-3 rounded-lg bg-red-500/20 border border-red-300 text-sm">Failed to create lead</div>}
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-100">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Phone</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Score</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-6 py-8 text-center text-gray-500" colSpan={6}>Loading leads...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-6 py-12 text-center" colSpan={6}>
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <span className="text-5xl">📭</span>
                    <p className="text-lg">No leads found</p>
                    <p className="text-sm">Try adjusting your filters or create a new lead above</p>
                  </div>
                </td></tr>
              ) : filtered.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-purple-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/leads/${l.id}`} className="text-purple-600 hover:text-purple-800 font-medium hover:underline">{l.name}</Link>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{l.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{l.email || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      l.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      l.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                      l.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      l.status === 'appointment_set' ? 'bg-orange-100 text-orange-800' :
                      l.status === 'showed' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {l.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {l.interest_score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${
                            l.interest_score >= 80 ? 'bg-green-500' :
                            l.interest_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} style={{ width: `${l.interest_score}%` }} />
                        </div>
                        <span className="text-gray-700 font-medium">{l.interest_score}</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

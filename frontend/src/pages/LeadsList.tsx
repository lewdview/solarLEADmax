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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="flex items-center gap-3 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name/phone/email" className="border rounded px-3 py-2 w-72" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-3 py-2">
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="font-medium mb-3">Quick create</div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input required name="name" placeholder="Name" className="border rounded px-3 py-2" />
          <input name="phone" placeholder="Phone (+1...)" className="border rounded px-3 py-2" />
          <input name="email" placeholder="Email" className="border rounded px-3 py-2" />
          <input required name="address" placeholder="Address" className="border rounded px-3 py-2 md:col-span-2" />
          <input name="source" placeholder="Source (website)" className="border rounded px-3 py-2" defaultValue="website" />
          <input name="monthly_bill" type="number" min={0} placeholder="Monthly bill ($)" className="border rounded px-3 py-2" />
          <div className="md:col-span-3">
            <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create lead'}
            </button>
          </div>
        </form>
        {createMut.error && <div className="text-sm text-red-600 mt-2">Failed to create lead</div>}
      </div>

      <div className="rounded border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="text-left px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-3" colSpan={6}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={6}>No leads</td></tr>
              ) : filtered.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2"><Link to={`/leads/${l.id}`} className="text-blue-600 hover:underline">{l.name}</Link></td>
                  <td className="px-4 py-2">{l.phone || '-'}</td>
                  <td className="px-4 py-2">{l.email || '-'}</td>
                  <td className="px-4 py-2">{l.status}</td>
                  <td className="px-4 py-2">{l.interest_score ?? '-'}</td>
                  <td className="px-4 py-2">{new Date(l.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

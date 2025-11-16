import { useQuery } from '@tanstack/react-query'
import { leadApi } from '../lib/api'

const statuses: { key: string; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'appointment_set', label: 'Booked' },
  { key: 'dead', label: 'Dead' },
]

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statuses.map(s => (
          <div key={s.key} className="rounded border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-2xl font-bold">{counts[s.key] || 0}</div>
          </div>
        ))}
      </div>

      <div className="rounded border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 font-medium border-b">Recent leads</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Score</th>
                <th className="text-left px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-3" colSpan={5}>Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td className="px-4 py-3" colSpan={5}>No data</td></tr>
              ) : recent.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2"><a className="text-blue-600 hover:underline" href={`/leads/${l.id}`}>{l.name}</a></td>
                  <td className="px-4 py-2">{l.phone || '-'}</td>
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

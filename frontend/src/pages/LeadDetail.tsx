import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { leadApi } from '../lib/api'

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>
}

function Bubble({ direction, message, created_at }: { direction: 'inbound' | 'outbound'; message: string; created_at: string }) {
  const me = direction === 'outbound'
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'} my-1`}>
      <div className={`max-w-[80%] rounded px-3 py-2 text-sm shadow ${me ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div>{message}</div>
        <div className={`mt-1 text-[10px] ${me ? 'text-blue-100/80' : 'text-gray-500'}`}>{new Date(created_at).toLocaleString()}</div>
      </div>
    </div>
  )
}

export default function LeadDetail() {
  const { id = '' } = useParams()
  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadApi.get(id) })

  if (isLoading) return <div>Loading...</div>
  if (!lead) return <div>Not found</div>

  const conversations = Array.isArray(lead.conversations)
    ? [...lead.conversations].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lead.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge>{lead.status}</Badge>
            {typeof lead.interest_score === 'number' && <Badge>Score: {lead.interest_score}</Badge>}
            {lead.homeowner != null && <Badge>{lead.homeowner ? 'Homeowner' : 'Renter'}</Badge>}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Created: {new Date(lead.created_at).toLocaleString()}</div>
          <div>Updated: {new Date(lead.updated_at).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="font-medium mb-2">Contact</div>
          <div>Phone: {lead.phone || '-'}</div>
          <div>Email: {lead.email || '-'}</div>
          <div>Address: {lead.address || '-'}</div>
          <div>Source: {lead.source || '-'}</div>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="font-medium mb-2">Qualification</div>
          <div>Monthly bill: {lead.monthly_bill != null ? `$${lead.monthly_bill}` : '-'}</div>
          <div>Timeline: {lead.timeline || '-'}</div>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="font-medium mb-2">Actions</div>
          <button className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled>
            Update Status (coming)
          </button>
        </div>
      </div>

      <div className="rounded border bg-white p-4 shadow-sm">
        <div className="font-medium mb-2">Conversation</div>
        {conversations.length === 0 ? (
          <div className="text-sm text-gray-500">No messages yet.</div>
        ) : (
          <div className="border rounded p-3 bg-gray-50">
            {conversations.map(c => (
              <Bubble key={c.id} direction={c.direction} message={c.message} created_at={c.created_at} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

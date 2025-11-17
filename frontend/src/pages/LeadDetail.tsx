import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { leadApi } from '../lib/api'

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{children}</span>
}

function Bubble({ direction, message, created_at }: { direction: 'inbound' | 'outbound'; message: string; created_at: string }) {
  const isInbound = direction === 'inbound'
  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
        isInbound 
          ? 'bg-white border-2 border-purple-100 text-gray-900' 
          : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
      }`}>
        <div className="leading-relaxed">{message}</div>
        <div className={`mt-1.5 text-[10px] flex items-center gap-1 ${
          isInbound ? 'text-gray-500' : 'text-white/70'
        }`}>
          <span>{isInbound ? '📩' : '📤'}</span>
          <span>{new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}

export default function LeadDetail() {
  const { id = '' } = useParams()
  const { data: lead, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => leadApi.get(id) })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">⏳</div>
        <div>Loading lead...</div>
      </div>
    </div>
  )
  if (!lead) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">🚫</div>
        <div>Lead not found</div>
      </div>
    </div>
  )

  const conversations = Array.isArray(lead.conversations)
    ? [...lead.conversations].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
    : []

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-3">{lead.name}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                lead.status === 'new' ? 'bg-blue-500/30 border border-blue-300' :
                lead.status === 'contacted' ? 'bg-purple-500/30 border border-purple-300' :
                lead.status === 'qualified' ? 'bg-green-500/30 border border-green-300' :
                lead.status === 'appointment_set' ? 'bg-orange-500/30 border border-orange-300' :
                'bg-gray-500/30 border border-gray-300'
              }`}>
                {lead.status.replace('_', ' ')}
              </span>
              {typeof lead.interest_score === 'number' && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
                  ⭐ Score: {lead.interest_score}
                </span>
              )}
              {lead.homeowner != null && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
                  {lead.homeowner ? '🏠 Homeowner' : '🏢 Renter'}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-white/80">
            <div>📅 {new Date(lead.created_at).toLocaleDateString()}</div>
            <div className="text-xs mt-1">Updated {new Date(lead.updated_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📞</span>
            <div className="font-semibold text-lg">Contact</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">Phone:</span>
              <span className="text-gray-900 font-medium">{lead.phone || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">Email:</span>
              <span className="text-gray-900 font-medium break-all">{lead.email || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">Address:</span>
              <span className="text-gray-900">{lead.address || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-gray-500 w-16">Source:</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-semibold">{lead.source || '—'}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚡</span>
            <div className="font-semibold text-lg">Qualification</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Monthly bill:</span>
              <span className="text-gray-900 font-semibold">
                {lead.monthly_bill != null ? `$${lead.monthly_bill}` : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Timeline:</span>
              <span className="text-gray-900 font-medium">{lead.timeline || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Contacts:</span>
              <span className="text-gray-900 font-medium">{lead.contact_attempts || 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚙️</span>
            <div className="font-semibold text-lg">Actions</div>
          </div>
          <button className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            Update Status (Coming Soon)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b flex items-center gap-2">
          <span className="text-xl">💬</span>
          <div className="font-semibold text-lg">Conversation History</div>
          <span className="ml-auto text-sm text-gray-600">{conversations.length} messages</span>
        </div>
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-gray-500 text-lg mb-1">No messages yet</div>
            <div className="text-gray-400 text-sm">Conversations will appear here once the lead is contacted</div>
          </div>
        ) : (
          <div className="p-6 bg-gradient-to-b from-gray-50 to-white max-h-[600px] overflow-y-auto">
            {conversations.map(c => (
              <Bubble key={c.id} direction={c.direction} message={c.message} created_at={c.created_at} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

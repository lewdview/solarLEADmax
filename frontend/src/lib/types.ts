export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'appointment_set' | 'showed' | 'no_show' | 'dead'

export interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  address: string
  source: string
  status: LeadStatus
  homeowner?: boolean
  monthly_bill?: number
  timeline?: string
  interest_score?: number
  created_at: string
  updated_at: string
  conversations?: Conversation[]
}

export type Channel = 'sms' | 'email' | 'voice'
export type Direction = 'inbound' | 'outbound'

export interface Conversation {
  id: string
  lead_id: string
  channel: Channel
  direction: Direction
  message: string
  ai_processed: boolean
  created_at: string
}

export type ApptStatus = 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled'

export interface Appointment {
  id: string
  lead_id: string
  calendly_event_id?: string
  scheduled_at?: string
  status: ApptStatus
  reminder_sent: boolean
  created_at: string
}

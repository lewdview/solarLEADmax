import { PrismaClient, LeadStatus } from '@prisma/client'

const prisma = new PrismaClient()

const mockLeads = [
  {
    name: 'Sarah Johnson',
    phone: '+15551234567',
    email: 'sarah.johnson@example.com',
    address: '123 Solar Ave, Phoenix, AZ 85001',
    source: 'website',
    status: 'qualified' as LeadStatus,
    homeowner: true,
    monthly_bill: 280,
    timeline: '1-3 months',
    interest_score: 85,
  },
  {
    name: 'Michael Chen',
    phone: '+15551234568',
    email: 'michael.chen@example.com',
    address: '456 Green St, San Diego, CA 92101',
    source: 'facebook',
    status: 'appointment_set' as LeadStatus,
    homeowner: true,
    monthly_bill: 320,
    timeline: 'immediate',
    interest_score: 95,
  },
  {
    name: 'Jennifer Martinez',
    phone: '+15551234569',
    email: 'jennifer.m@example.com',
    address: '789 Sun Blvd, Las Vegas, NV 89101',
    source: 'google',
    status: 'contacted' as LeadStatus,
    homeowner: true,
    monthly_bill: 150,
    timeline: '3-6 months',
    interest_score: 65,
  },
  {
    name: 'David Thompson',
    phone: '+15551234570',
    email: 'david.t@example.com',
    address: '321 Energy Rd, Austin, TX 78701',
    source: 'referral',
    status: 'new' as LeadStatus,
    homeowner: true,
    monthly_bill: 220,
    timeline: '1-3 months',
    interest_score: 70,
  },
  {
    name: 'Emily Rodriguez',
    phone: '+15551234571',
    email: 'emily.rodriguez@example.com',
    address: '654 Power Ln, Miami, FL 33101',
    source: 'website',
    status: 'qualified' as LeadStatus,
    homeowner: true,
    monthly_bill: 380,
    timeline: 'immediate',
    interest_score: 90,
  },
  {
    name: 'Robert Kim',
    phone: '+15551234572',
    email: null,
    address: '987 Bright Ct, Houston, TX 77001',
    source: 'facebook',
    status: 'contacted' as LeadStatus,
    homeowner: true,
    monthly_bill: 195,
    timeline: '3-6 months',
    interest_score: 60,
  },
  {
    name: 'Lisa Anderson',
    phone: '+15551234573',
    email: 'lisa.anderson@example.com',
    address: '147 Solar Park, Denver, CO 80201',
    source: 'google',
    status: 'new' as LeadStatus,
    homeowner: false,
    monthly_bill: 120,
    timeline: '6+ months',
    interest_score: 45,
  },
  {
    name: 'James Wilson',
    phone: '+15551234574',
    email: 'james.wilson@example.com',
    address: '258 Renewable Way, Portland, OR 97201',
    source: 'website',
    status: 'showed' as LeadStatus,
    homeowner: true,
    monthly_bill: 410,
    timeline: 'immediate',
    interest_score: 98,
  },
  {
    name: 'Maria Garcia',
    phone: '+15551234575',
    email: 'maria.garcia@example.com',
    address: '369 Clean Energy Dr, Albuquerque, NM 87101',
    source: 'referral',
    status: 'appointment_set' as LeadStatus,
    homeowner: true,
    monthly_bill: 275,
    timeline: '1-3 months',
    interest_score: 88,
  },
  {
    name: 'Christopher Lee',
    phone: '+15551234576',
    email: null,
    address: '741 Eco St, Seattle, WA 98101',
    source: 'facebook',
    status: 'dead' as LeadStatus,
    homeowner: false,
    monthly_bill: 95,
    timeline: null,
    interest_score: 20,
  },
  {
    name: 'Amanda Brown',
    phone: '+15551234577',
    email: 'amanda.brown@example.com',
    address: '852 Sunshine Ave, Sacramento, CA 95814',
    source: 'google',
    status: 'qualified' as LeadStatus,
    homeowner: true,
    monthly_bill: 340,
    timeline: 'immediate',
    interest_score: 92,
  },
  {
    name: 'Daniel Taylor',
    phone: '+15551234578',
    email: 'daniel.taylor@example.com',
    address: '963 Green Power Rd, Salt Lake City, UT 84101',
    source: 'website',
    status: 'contacted' as LeadStatus,
    homeowner: true,
    monthly_bill: 210,
    timeline: '3-6 months',
    interest_score: 72,
  },
]

async function main() {
  console.log('🌱 Seeding database with mock leads...')

  // Clear existing demo leads (optional - comment out if you want to keep existing)
  // await prisma.lead.deleteMany({})
  // console.log('🗑️  Cleared existing leads')

  for (const lead of mockLeads) {
    await prisma.lead.create({
      data: {
        ...lead,
        last_contact: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
        contact_attempts: Math.floor(Math.random() * 5),
      },
    })
  }

  console.log(`✅ Created ${mockLeads.length} mock leads`)

  // Add some mock conversations for a few leads
  const leadsWithConvos = await prisma.lead.findMany({ take: 3 })
  
  for (const lead of leadsWithConvos) {
    await prisma.conversation.createMany({
      data: [
        {
          lead_id: lead.id,
          channel: 'sms',
          direction: 'outbound',
          message: `Hi ${lead.name.split(' ')[0]}, thanks for your interest in solar! I'd love to learn more about your home and energy goals. Are you the homeowner?`,
          ai_processed: true,
        },
        {
          lead_id: lead.id,
          channel: 'sms',
          direction: 'inbound',
          message: 'Yes, I own my home. I\'m interested in reducing my electric bill.',
          ai_processed: true,
        },
        {
          lead_id: lead.id,
          channel: 'sms',
          direction: 'outbound',
          message: 'Great! What\'s your average monthly electric bill?',
          ai_processed: true,
        },
        {
          lead_id: lead.id,
          channel: 'sms',
          direction: 'inbound',
          message: `Around $${lead.monthly_bill || 200} per month`,
          ai_processed: false,
        },
      ],
    })
  }

  console.log(`💬 Added conversations for ${leadsWithConvos.length} leads`)
  console.log('✨ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

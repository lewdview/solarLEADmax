# solarLEADmax n8n Workflows

This directory contains three production-ready n8n workflow JSON files that automate the complete solar lead qualification and appointment booking process.

## 📋 Workflows Overview

### 1. Lead Intake & Initial Contact
**File:** `1-lead-intake-initial-contact.json`

**Purpose:** Webhook-triggered workflow that receives new leads, validates data, stores them in the backend, and sends initial contact SMS automatically.

**Flow:**
1. Webhook receives POST with lead data (name, phone, email, address, source, monthly_bill)
2. Validates required fields and normalizes phone to E.164 format
3. Sends lead to backend API `/api/leads/intake` (with automatic deduplication)
4. Checks if lead was deduped
5. Returns success response (backend worker handles initial SMS automatically)

**Trigger:** Webhook at `https://your-n8n.cloud/webhook/lead-intake`

**Backend dependencies:** POST `/api/leads/intake`

---

### 2. Follow-Up Sequence
**File:** `2-follow-up-sequence.json`

**Purpose:** Automated nurture sequence that sends timely follow-ups based on lead status and last contact timestamp.

**Flow:**
1. Cron trigger runs every 2 hours
2. Fetches all active leads (status: new, contacted, interested, qualified)
3. Filters leads needing follow-up based on hours since last contact:
   - **Day 1** (24h): Simple SMS follow-up for 'new' leads
   - **Day 3** (72h): Educational email for 'new' or 'contacted' leads
   - **Day 7** (168h): Final CTA SMS + email for all non-dead/non-booked leads
4. Routes each lead to appropriate communication channel
5. Sends SMS via Twilio and/or email via backend API

**Trigger:** Cron (every 2 hours)

**Backend dependencies:** 
- GET `/api/leads?status=new,contacted,interested,qualified`
- POST `/api/leads/:id/send-email` (with type: educational, final_cta)

**Note:** Requires backend endpoint for email sending (currently uses hypothetical endpoint - implement if needed)

---

### 3. Appointment Booking & Management
**File:** `3-appointment-management.json`

**Purpose:** Handles appointment booking requests, generates Calendly scheduling links, sends confirmations, and manages reminders.

**Flow:**
1. **Booking Path:**
   - Webhook receives POST with lead_id (and optional event_type_uuid)
   - Fetches lead details from backend
   - Fetches Calendly event types
   - Checks if lead has email:
     - **Yes:** Creates personalized Calendly scheduling link, sends email with link
     - **No:** Sends SMS with public scheduling URL
   - Updates lead status to 'booked'
   - Returns success response

2. **Reminder Path:**
   - Cron trigger runs every 12 hours
   - Fetches all 'booked' leads
   - Filters appointments in next 24 hours (currently returns all for demo)
   - Sends reminder SMS to each lead

**Trigger:** 
- Webhook at `https://your-n8n.cloud/webhook/book-appointment`
- Cron (every 12 hours for reminders)

**Backend dependencies:**
- GET `/api/leads/:id`
- PATCH `/api/leads/:id` (update status to 'booked')
- POST `/api/leads/:id/send-email` (with type: appointment_confirmation)

**Calendly dependencies:**
- GET `https://api.calendly.com/event_types`
- POST `https://api.calendly.com/scheduling_links`

---

## 🚀 Setup Instructions

### Prerequisites
1. **n8n Cloud account** or self-hosted n8n instance
2. **Backend API running** on Railway (or your hosting platform)
3. **Service credentials:**
   - Twilio account (Account SID, Auth Token, phone number)
   - Calendly API access token
   - Backend API URL

### Step 1: Configure Environment Variables in n8n

In your n8n instance, go to Settings → Variables and add:

```env
BACKEND_API_URL=https://your-backend.railway.app
EMAIL_FROM=solai@yourdomain.com
CALENDLY_ACCESS_TOKEN=your_calendly_token_here
```

### Step 2: Set Up Credentials

**Twilio Credentials:**
1. Go to n8n → Credentials → Add Credential → Twilio
2. Name: `Twilio Credentials` (exact name used in workflows)
3. Enter Account SID, Auth Token, and FROM phone number
4. Save

**HTTP Header Auth (for Backend API):**
1. Go to n8n → Credentials → Add Credential → HTTP Header Auth
2. Name: Choose any (you'll select this in each HTTP node)
3. Header Name: `Authorization` (or leave empty if no auth required for testing)
4. Header Value: `Bearer YOUR_API_KEY` (if you add API key auth later)
5. Save

**Note:** The workflows currently don't enforce backend API authentication, but you should add it for production.

### Step 3: Import Workflows

1. In n8n, go to Workflows → Import from File
2. Import each JSON file in order:
   - `1-lead-intake-initial-contact.json`
   - `2-follow-up-sequence.json`
   - `3-appointment-management.json`
3. After import, open each workflow and:
   - Click on HTTP Request nodes
   - Select your HTTP Header Auth credential
   - Click on Twilio nodes
   - Select your Twilio Credentials
4. Activate each workflow

### Step 4: Update Webhook URLs

After activating workflows 1 and 3, n8n will generate webhook URLs. You'll need these for:

**Workflow 1 (Lead Intake):**
- Webhook URL: `https://your-n8n.cloud/webhook/lead-intake`
- Use this URL in your lead capture forms, APIs, or Zapier/Make integrations

**Workflow 3 (Appointment Booking):**
- Webhook URL: `https://your-n8n.cloud/webhook/book-appointment`
- Use this URL when a hot lead is ready to book (can be called from frontend or backend)

### Step 5: Test Each Workflow

**Test Workflow 1 (Lead Intake):**
```bash
curl -X POST https://your-n8n.cloud/webhook/lead-intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+15555551234",
    "email": "john@example.com",
    "address": "123 Main St, Phoenix, AZ",
    "source": "website",
    "monthly_bill": 250
  }'
```

**Test Workflow 2 (Follow-Up):**
- Manually trigger the workflow from n8n UI
- Check execution log to see which leads were filtered for follow-up

**Test Workflow 3 (Booking):**
```bash
curl -X POST https://your-n8n.cloud/webhook/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "lead_id": "cm7s5yc0l0000107hgrqx86yp"
  }'
```

---

## 📊 Monitoring & Maintenance

### Execution History
- n8n automatically logs all executions (configurable retention period)
- Go to Executions tab to view success/failure rates
- Set up error notifications in n8n Settings

### Common Issues

**Workflow 2 not sending follow-ups:**
- Check that leads have `last_contact` timestamp populated
- Verify cron schedule is active (check last execution time)
- Ensure backend API returns leads with proper status filtering

**Workflow 3 Calendly errors:**
- Verify CALENDLY_ACCESS_TOKEN is valid
- Check that your Calendly account has event types set up
- Ensure scheduling links API is enabled in your Calendly plan

**Twilio SMS not sending:**
- Verify phone number is in E.164 format (+1XXXXXXXXXX)
- Check Twilio credentials are correct
- Ensure Twilio account has sufficient balance

### Scaling Considerations

**High volume (10K+ leads/month):**
- Workflow 2 cron may need adjustment (increase to every 1 hour if follow-ups are delayed)
- Consider splitting follow-up sequence into 3 separate workflows (one per day)
- Add error handling nodes for API failures

**Cost optimization:**
- Reduce Workflow 2 execution frequency to every 4-6 hours
- Implement backend API caching for GET /api/leads calls
- Use n8n's built-in rate limiting on HTTP nodes

---

## 🔄 Integration with Backend

These workflows integrate with your existing solarLEADmax backend. The backend handles:
- Lead storage and deduplication (POST /api/leads/intake)
- AI qualification via OpenAI (triggered by incoming SMS to Twilio webhook)
- Initial contact SMS (via Bull queue worker)
- Conversation history storage

The n8n workflows handle:
- Lead intake routing (Workflow 1)
- Automated follow-up sequences (Workflow 2)
- Appointment booking coordination (Workflow 3)

**Note:** You may need to create a new backend endpoint for email sending:
```typescript
// backend/src/api/routes/leads.ts
router.post('/:id/send-email', leadsController.sendEmail);

// backend/src/api/controllers/leads.controller.ts
export async function sendEmail(req: Request, res: Response) {
  const { id } = req.params;
  const { type, scheduling_link } = req.body;
  
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || !lead.email) {
    return res.status(400).json({ error: 'Lead not found or no email' });
  }
  
  // Use existing email service
  switch (type) {
    case 'educational':
      await sendEducationalEmail(lead.email, lead.name);
      break;
    case 'final_cta':
      await sendFinalCTAEmail(lead.email, lead.name);
      break;
    case 'appointment_confirmation':
      await sendAppointmentConfirm(lead.email, lead.name, scheduling_link);
      break;
  }
  
  res.json({ success: true });
}
```

---

## 📝 Customization Tips

### Adjusting Follow-Up Timing
Edit Workflow 2 filter function to change follow-up schedule:
```javascript
// Day 1 follow-up (24 hours) → change to 48 hours:
if (hoursSince >= 48 && hoursSince < 50 && lead.status === 'new') {
  followUpType = 'day1';
}
```

### Adding New Follow-Up Types
1. Add new condition in filter function
2. Add new routing node (duplicate "Day 3 Follow-Up?" node)
3. Add new SMS/email send nodes
4. Connect to routing logic

### Customizing SMS/Email Content
Edit the Twilio node or email preparation function nodes directly in n8n UI.

---

## 🎯 Next Steps

1. **Monitor first 100 leads** through the system to validate timing
2. **Adjust follow-up frequency** based on response rates
3. **A/B test** different SMS messages in Workflow 2
4. **Add analytics** by connecting n8n to your CRM or data warehouse
5. **Implement backend email endpoint** if not already done

---

## 📞 Support

For n8n-specific issues:
- [n8n Community Forum](https://community.n8n.io)
- [n8n Documentation](https://docs.n8n.io)

For solarLEADmax backend issues:
- Check backend logs on Railway
- Review `backend/docs/` directory for API documentation

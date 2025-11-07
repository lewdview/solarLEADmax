# solarLEADmax - Quick Start Guide 🚀

Get **solarLEADmax** running locally in under 10 minutes!

---

## ✅ Prerequisites

Before starting, ensure you have:

### Required Software
- **Node.js** >= 24.3.0 ([download](https://nodejs.org/))
- **npm** >= 11.4.2 (comes with Node.js)
- **PostgreSQL** (local or Railway account)
- **Redis** (local or Railway account)

### Required API Keys
- **OpenAI API Key** ([get key](https://platform.openai.com/api-keys))
- **Twilio Account** ([sign up](https://www.twilio.com/try-twilio))
  - Account SID
  - Auth Token
  - Phone Number (with SMS capability)
- **Calendly API Key** ([get key](https://calendly.com/integrations/api_webhooks))
  - Personal Access Token
  - Event Type UUID

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
cd /Volumes/extremeUno/solarLEADmax

# Install root dependencies (ESLint, Prettier, etc.)
npm install

# Install backend dependencies
cd backend
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the environment template
cd /Volumes/extremeUno/solarLEADmax
cp .env.template .env

# Edit .env and fill in your API keys
# Required immediately:
# - OPENAI_API_KEY
# - TWILIO_ACCOUNT_SID
# - TWILIO_AUTH_TOKEN
# - TWILIO_PHONE_NUMBER
# - CALENDLY_API_KEY
# - CALENDLY_EVENT_TYPE_UUID
# - DATABASE_URL (PostgreSQL connection string)
# - REDIS_URL (Redis connection string)
```

**Example .env:**
```env
NODE_ENV=development
PORT=3000

OPENAI_API_KEY=sk-proj-xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
CALENDLY_API_KEY=xxxxx
CALENDLY_EVENT_TYPE_UUID=xxxxx-xxxx-xxxx-xxxx-xxxxx

DATABASE_URL=postgresql://user:password@localhost:5432/solarleadmax
REDIS_URL=redis://localhost:6379

CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-change-in-prod
```

---

## 🗄️ Database Setup

### Option A: Local PostgreSQL

```bash
# Create database
psql -c "CREATE DATABASE solarleadmax;"

# Run migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

### Option B: Railway (Recommended for Quick Start)

1. Sign up at [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL plugin
4. Add Redis plugin
5. Copy connection strings to your `.env` file
6. Run migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

---

## 🚀 Running the Application

### Terminal 1: Backend API

```bash
cd /Volumes/extremeUno/solarLEADmax/backend
npm run dev
```

**API will be available at:** `http://localhost:3000`

### Terminal 2: Worker (Queue Processor)

```bash
cd /Volumes/extremeUno/solarLEADmax/backend
npm run worker
```

**Worker processes:**
- Initial SMS contact
- AI conversation processing
- Appointment reminders

### Terminal 3 (Optional): Frontend Dashboard

*Coming in next step - for now, use API directly*

---

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}
```

### Create a Lead

```bash
curl -X POST http://localhost:3000/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+15551234567",
    "email": "john@example.com",
    "address": "123 Main St, San Francisco, CA",
    "source": "website",
    "monthly_bill": 250
  }'
```

**Expected Response:**
```json
{
  "lead_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### List Leads

```bash
curl http://localhost:3000/api/leads
```

### Get Lead Details

```bash
curl http://localhost:3000/api/leads/550e8400-e29b-41d4-a716-446655440000
```

---

## 📱 Webhook Configuration (Local Dev)

For local development, use **ngrok** to expose your local API:

### Install ngrok

```bash
# Mac (via Homebrew)
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### Expose Local API

```bash
ngrok http http://localhost:3000
```

Copy the **Forwarding URL** (e.g., `https://abc123.ngrok.io`)

### Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → Your number
3. Under **Messaging**, set webhook to:
   ```
   https://abc123.ngrok.io/api/webhooks/twilio
   ```
4. Method: **POST**

### Configure Calendly Webhook

1. Go to [Calendly Webhooks](https://calendly.com/integrations/api_webhooks)
2. Create webhook subscription:
   ```
   https://abc123.ngrok.io/api/webhooks/calendly
   ```
3. Events: `invitee.created`, `invitee.canceled`, `invitee.rescheduled`

---

## ✅ Verification

### Test End-to-End Flow

1. **POST a lead** via `/api/leads/intake`
2. **Check worker logs** - should show "sending initial SMS"
3. **Receive SMS** on your test phone number
4. **Reply to SMS** - should be captured in database
5. **Check conversation** via `/api/leads/:id`

### Check Database

```bash
cd backend
npx prisma studio
```

Opens Prisma Studio at `http://localhost:5555` to browse data.

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
```bash
cd backend
npm install
npx prisma generate
```

### Issue: Database connection error
- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check database exists: `psql -l`

### Issue: Redis connection error
- Verify `REDIS_URL` in `.env`
- Ensure Redis is running: `redis-cli ping`

### Issue: Twilio API error
- Verify Account SID, Auth Token in `.env`
- Ensure phone number has SMS capability
- Check Twilio Console for error logs

### Issue: OpenAI API error
- Verify API key starts with `sk-`
- Check billing is set up at [platform.openai.com](https://platform.openai.com)

---

## 📚 Next Steps

### Phase 1 Complete ✅

You now have:
- ✅ Lead intake API with validation
- ✅ Twilio SMS integration
- ✅ OpenAI setup (AI logic in Phase 2)
- ✅ Calendly webhook handler
- ✅ Bull queues + worker
- ✅ Prisma ORM + PostgreSQL

### What's Next?

1. **Install root linting tools:**
   ```bash
   cd /Volumes/extremeUno/solarLEADmax
   npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin \
     eslint-config-prettier eslint-plugin-import eslint-plugin-simple-import-sort \
     prettier eslint-plugin-import-x
   ```

2. **Build Frontend Dashboard** (Phase 1 remaining)
   - Create React + Vite app
   - Display leads in table
   - Show conversion funnel

3. **Implement AI Conversations** (Phase 2)
   - Complete OpenAI GPT-4o integration
   - Add function calling for qualification
   - Auto-scoring and routing

4. **Deploy to Railway**
   - Push to GitHub
   - Connect Railway project
   - Deploy API + Worker services

5. **Set up n8n Workflows**
   - Import workflow templates
   - Connect to deployed API
   - Test automation end-to-end

---

## 📞 Support

- **Issues:** Check existing GitHub issues
- **Questions:** Review README.md and docs/
- **API Reference:** See docs/API.md

---

## 🎉 Success!

You're ready to start processing solar leads with AI! 🌞⚡

**Next Command:**
```bash
# Start both services
cd /Volumes/extremeUno/solarLEADmax/backend
npm run dev & npm run worker
```

Then POST your first lead to `/api/leads/intake` and watch the magic happen!

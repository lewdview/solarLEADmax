# SolarLEADmax Demo Guide 🌞

Get the **SolarLEADmax demo** running in under 5 minutes!

---

## What's in the Demo?

- **Static demo page** at `http://localhost:3000/demo` with a beautiful lead form
- **Demo API endpoint** at `/api/demo/onboarding` that accepts leads without external service calls
- **DEMO_MODE** flag to safely test the system without requiring Twilio, OpenAI, or database connections
- **Frontend dashboard** (optional) at `http://localhost:3001` showing leads pipeline

---

## Quick Start (No External Services Required)

### Step 1: Set DEMO_MODE=true

```bash
# Copy the template if you haven't already
cp .env.template .env

# Edit .env and set:
DEMO_MODE=true
```

With `DEMO_MODE=true`, the demo endpoint will **skip all external API calls** (Twilio, OpenAI, database). You can run the demo with **zero credentials**.

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Start the Backend API

```bash
npm run dev:backend
```

API will be available at `http://localhost:3000`

### Step 4: Test the Demo

#### Option A: Static Demo Page (Easiest)

Open your browser:
```
http://localhost:3000/demo
```

Fill out the form and submit. You'll see a success message with a generated lead ID.

#### Option B: Via curl

```bash
curl -X POST http://localhost:3000/api/demo/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "phone": "+15551234567",
    "email": "jane@example.com"
  }'
```

Expected response:
```json
{
  "success": true,
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "DEMO",
  "name": "Jane Doe",
  "phone": "+15551234567",
  "email": "jane@example.com",
  "message": "Demo lead created successfully (no external services called)"
}
```

#### Option C: Frontend Dashboard (Optional)

In a separate terminal:
```bash
npm run dev:frontend
```

Open `http://localhost:3001` to see the React dashboard (note: this requires the backend API to be running).

---

## Full Demo with External Services

If you want to test the **full system** with SMS, AI, and database:

### Prerequisites

- PostgreSQL database (Railway or local)
- Redis instance (Railway or local)
- Twilio account (trial OK)
- OpenAI API key

### Setup

1. **Set DEMO_MODE=false** in `.env`:
```bash
DEMO_MODE=false
```

2. **Fill in all API keys** in `.env`:
```env
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
CALENDLY_API_KEY=...
CALENDLY_EVENT_TYPE_UUID=...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

3. **Run database migrations:**
```bash
npm run -w backend prisma:migrate
```

4. **Start API and Worker:**
```bash
# Terminal 1: API
npm run dev:backend

# Terminal 2: Worker (processes queues)
npm run dev:worker
```

5. **Use the production intake endpoint:**
```bash
curl -X POST http://localhost:3000/api/leads/intake \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "+15551234567",
    "email": "john@example.com",
    "address": "123 Main St, Phoenix, AZ",
    "source": "website",
    "monthly_bill": 250
  }'
```

This will:
- ✅ Validate phone via Twilio Lookup
- ✅ Create lead in database
- ✅ Queue initial SMS via Bull
- ✅ Worker sends SMS via Twilio
- ✅ Inbound SMS triggers AI conversation

---

## Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

# Demo endpoint health
curl http://localhost:3000/api/demo/ping
# Expected: {"ok":true,"demo_mode":true}
```

---

## Demo Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/demo` | GET | Static demo page with form |
| `/api/demo/onboarding` | POST | Submit demo lead |
| `/api/demo/ping` | GET | Health check + demo mode status |
| `/api/health` | GET | API health check |
| `/onboarding` | GET | Production onboarding form |
| `/progress` | GET | Project progress one-pager |

---

## Troubleshooting

### Issue: "Cannot find module"
```bash
npm install
npm run -w backend prisma:generate
```

### Issue: Port 3000 already in use
```bash
# Change PORT in .env
PORT=3001
```

### Issue: CORS errors from frontend
Make sure `.env` includes both origins:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3001
```

### Issue: Demo mode not working
Verify `.env` has:
```env
DEMO_MODE=true
```

Restart the backend after changing `.env`.

---

## Next Steps

1. ✅ **Try the static demo** at `/demo`
2. ✅ **Test the API** with curl
3. ✅ **Run the frontend** dashboard (optional)
4. 🚀 **Deploy to Railway** following [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)
5. 🌐 **Set up webhooks** for Twilio and Calendly

---

## Demo Architecture

```
┌─────────────────┐
│  Static Demo    │
│  /demo          │  ──┐
└─────────────────┘    │
                       ▼
┌─────────────────┐  ┌──────────────────┐
│  Frontend       │  │  Express API     │
│  localhost:3001 │──▶│  localhost:3000  │
└─────────────────┘  └──────────────────┘
                              │
                              ▼
                     ┌────────────────┐
                     │ DEMO_MODE?     │
                     └────────────────┘
                       │             │
                 true  │             │  false
                       ▼             ▼
              ┌─────────────┐  ┌──────────────┐
              │ Return UUID │  │ Call Twilio, │
              │ (stub mode) │  │ OpenAI, DB   │
              └─────────────┘  └──────────────┘
```

---

**Built with ⚡ by the solarLEADmax Team**

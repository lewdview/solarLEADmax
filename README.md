# solarLEADmax 🌞⚡

**AI-Powered Solar Lead Qualification & Appointment Setting System**

Automate solar lead intake, qualification, nurturing, and appointment booking using OpenAI GPT-4o, Twilio, Calendly, and n8n workflows.

---

## 🚀 Features

- **Intelligent Lead Intake**: Validate phone/email, dedupe, geocode addresses
- **AI Qualification**: GPT-4o conversations via SMS to qualify homeowners
- **Multi-Channel Follow-Up**: SMS, Email (coming), Voice (coming)
- **Automated Booking**: Direct integration with Calendly
- **n8n Workflows**: Cloud-based automation orchestration
- **Real-Time Dashboard**: Track leads through entire funnel
- **Production-Ready**: Built for 10,000+ leads/month

---

## 🏗️ Architecture

```
solarLEADmax/
├── backend/              # Express API + Worker (Node.js + TypeScript)
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── services/    # OpenAI, Twilio, Calendly
│   │   ├── worker/      # Bull queue processors
│   │   └── prisma/      # Database ORM
├── frontend/            # React Dashboard (Vite + TypeScript)
├── n8n-workflows/       # Automation workflow templates
└── docs/                # Complete documentation
```

**Tech Stack:**
- Backend: Node.js 24 + Express + TypeScript + Prisma ORM
- Database: PostgreSQL (Railway)
- Queue: Bull + Redis
- AI: OpenAI GPT-4o with function calling
- SMS/Voice: Twilio
- Scheduling: Calendly API
- Automation: n8n Cloud
- Frontend: React + Vite + Tailwind CSS
- Deployment: Railway (backend) + Vercel (frontend)

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 24.3.0
- npm >= 11.4.2
- PostgreSQL database (Railway or local)
- Redis instance (Railway or local)
- API Keys: OpenAI, Twilio, Calendly

### Installation

```bash
# Clone and navigate
cd /Volumes/extremeUno/solarLEADmax

# Install all dependencies
npm install

# Copy environment template
cp .env.template .env

# Fill in your API keys in .env

# Generate Prisma client and run migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init

# Start backend API (terminal 1)
npm run dev

# Start worker (terminal 2)
npm run worker

# Start frontend dashboard (terminal 3)
cd ../frontend
npm run dev
```

Visit:
- API: http://localhost:3000
- Dashboard: http://localhost:5173
- Health Check: http://localhost:3000/api/health

---

## 📖 Documentation

- **[Setup Guide](docs/SETUP.md)**: Complete local & production setup
- **[API Reference](docs/API.md)**: All endpoints with examples
- **[Database Schema](docs/DATABASE.md)**: Prisma models and relationships
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Railway + Vercel deployment
- **[Roadmap](docs/ROADMAP.md)**: Phases 2-6 implementation plan

---

## 🔑 Environment Variables

See `.env.template` for all required variables:

```env
# Core
NODE_ENV=development
PORT=3000

# AI & Communication
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
CALENDLY_API_KEY=...
CALENDLY_EVENT_TYPE_UUID=...

# Infrastructure
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

## 🧪 Testing

```bash
# Run backend tests
npm run test:backend

# Run with coverage
cd backend && npm test -- --coverage
```

---

## 🚢 Deployment

### Railway (Backend + Worker)
```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Deploy via Railway CLI or GitHub integration
railway up
```

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/leads/intake` | POST | Create new lead |
| `/api/leads` | GET | List all leads |
| `/api/leads/:id` | GET | Get lead details |
| `/api/leads/:id` | PATCH | Update lead |
| `/api/webhooks/twilio` | POST | Twilio SMS webhook |
| `/api/webhooks/calendly` | POST | Calendly event webhook |

---

## 🎯 Phase 1 Complete ✅

- ✅ Lead intake API with validation & dedup
- ✅ Twilio SMS integration
- ✅ OpenAI GPT-4o setup (stub for Phase 2)
- ✅ Calendly webhook handler
- ✅ Bull queue + Redis worker
- ✅ Prisma ORM with PostgreSQL
- ✅ Health checks & error handling
- ✅ TypeScript strict mode
- ✅ Railway + Vercel ready

**Next: Phase 2 - Complete AI conversation engine**

---

## 📝 License

MIT

---

**Built with ⚡ by the solarLEADmax Team**

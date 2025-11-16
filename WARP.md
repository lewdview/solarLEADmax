# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository overview
- Monorepo using npm workspaces. Present workspace: backend (Node.js 24 + TypeScript + Express + Prisma). A frontend workspace is referenced but not yet present.
- Core integrations: PostgreSQL (Prisma), Redis (Bull queues), OpenAI (GPT-4o), Twilio (SMS/Voice), Calendly (webhooks), n8n workflow templates.
- Deployment target: Railway (backend API + worker). See RAILWAY_DEPLOY.md for details.

## Big-picture architecture (how it works)
- HTTP API (backend/src/index.ts): Express server with security middleware (helmet, CORS, rate limiting), request logging, and JSON body parsing. Routes mounted at /api.
- Routes and controllers:
  - /api/leads (backend/src/api/controllers/leads.controller.ts): Lead intake, list, get, update.
    - Intake flow: validates input (zod), Twilio Lookup to validate phone, dedup by phone/email, creates Lead, then enqueues initial-contact job.
  - /api/webhooks (backend/src/api/controllers/webhooks.controller.ts):
    - Twilio SMS webhook: stores inbound message as Conversation, enqueues ai-process job.
    - Calendly webhook: placeholder handler for scheduling events.
  - /api/health (backend/src/api/routes/health.ts): healthcheck.
- Services layer (backend/src/services):
  - queue.ts: Bull queues (initial-contact, ai-process, reminders) using REDIS_URL.
  - twilio.ts: phone lookup, SMS send, initial contact messaging, and optional outbound voice call initiation for hot leads.
  - openai.ts: complete AI conversation engine with function calling (qualify_lead, book_appointment, mark_unqualified). Pulls conversation context, extracts data heuristically, calls OpenAI, applies function results to DB, and sends SMS replies.
  - conversationContext.ts: builds conversation history, stores messages, state analysis, pattern extraction (homeowner status, bill, timeline), engagement scoring, and human escalation heuristics.
  - prompts.ts: system prompt, response templates, scoring and qualification helpers.
  - prisma.ts: Prisma client instance.
- Worker (backend/src/worker/index.ts): separate process consuming queues. Processes:
  - initial-contact → sends first SMS to new leads.
  - ai-process → runs processMessageWithAI on inbound messages.
  - reminders → stub for future reminders.
- Data model (backend/prisma/schema.prisma):
  - Lead: core lead data and qualification fields, status enum, interest_score.
  - Conversation: per-message record with channel and direction.
  - Appointment: booking lifecycle with status enum.

## Common commands
All commands assume the repository root unless noted.

- Install and generate client
  - npm install
  - Prisma client (auto-runs on postinstall for backend). To run manually:
    - npm run -w backend prisma:generate

- Environment setup
  - cp .env.template .env (fill in OPENAI/Twilio/Calendly/DATABASE_URL/REDIS_URL/CORS_ORIGIN/JWT_SECRET)

- Development (API and worker)
  - API (from root): npm run dev:backend
  - Worker (from root): npm run dev:worker
  - Alternatively (from backend/): npm run dev and npm run worker

- Linting/formatting/typecheck
  - Lint: npm run lint
  - Format: npm run format
  - Typecheck: npm run typecheck (builds TS for backend; frontend workspace is not yet present)

- Build and start (production-ish)
  - Build backend: npm run build:backend
  - Start built API: npm run -w backend start

- Prisma (DB)
  - Generate client: npm run -w backend prisma:generate
  - Dev migrations (local dev): npm run -w backend prisma:dev
  - Deploy migrations (prod/staging): npm run -w backend prisma:migrate
  - Inspect data: (from backend/) npx prisma studio

- Tests (backend, Jest)
  - Run all: npm run test:backend
  - Single file: npm run -w backend test -- path/to/file.test.ts
  - Single test name: npm run -w backend test -- -t "test name pattern"
  - Coverage: npm run -w backend test -- --coverage

- Local smoke tests
  - From backend/: ./test-local.sh  (verifies health endpoint, Postgres, and Redis)

- Docker (backend only)
  - Build: docker build -f backend/Dockerfile -t solarleadmax-backend .
  - Run: docker run --env-file .env -p 3000:3000 solarleadmax-backend

- Useful HTTP checks
  - Health: curl http://localhost:3000/api/health
  - Create lead (example): see QUICK_START.md for full curl examples.

## Important paths (quick reference)
- backend/src/index.ts — Express app setup and middleware
- backend/src/api/routes/* — Route modules
- backend/src/api/controllers/* — Business logic handlers
- backend/src/services/openai.ts — AI engine and function-calling handlers
- backend/src/services/conversationContext.ts — Conversation state/context utilities
- backend/src/services/twilio.ts — Twilio integrations (SMS, calls)
- backend/src/services/queue.ts — Bull queues
- backend/src/worker/index.ts — Queue processors
- backend/prisma/schema.prisma — Database models and enums
- backend/src/config/env.ts — Environment validation (zod)

## Notes and caveats for Warp
- Workspaces: Root package.json declares backend and frontend workspaces; frontend is not yet present. dev:frontend/build:frontend will fail until frontend is added.
- External services required for full functionality: PostgreSQL (DATABASE_URL), Redis (REDIS_URL), Twilio, OpenAI, and Calendly credentials. Without Redis/Postgres, the worker and many API flows will fail. Use the .env.template as the source of truth.
- Webhooks (local dev): Twilio and Calendly webhooks require a public URL (e.g., via ngrok). QUICK_START.md includes setup guidance.
- Deployment: Railway deployment configuration is provided (railway.json, RAILWAY_DEPLOY.md). The backend Dockerfile builds and starts the API; the worker uses the same image with a different start command (node dist/worker/index.js).

## Key docs to read next
- README.md — Architecture, features, quick start, endpoints
- QUICK_START.md — Env setup, local running, webhook config, test commands
- RAILWAY_DEPLOY.md — Multi-environment Railway deployment (API + worker)
- n8n-workflows/*.json — Importable workflow templates

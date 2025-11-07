#!/bin/bash

# solarLEADmax Backend Setup Script
# Generates all TypeScript source files for Phase 1

cd "$(dirname "$0")/backend"

echo "🚀 Setting up solarLEADmax backend..."

# TypeScript configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
EOF

# Prisma schema
cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LeadStatus {
  new
  contacted
  qualified
  appointment_set
  showed
  no_show
  dead
}

enum Channel {
  sms
  email
  voice
}

enum Direction {
  inbound
  outbound
}

enum ApptStatus {
  scheduled
  confirmed
  completed
  no_show
  cancelled
}

model Lead {
  id               String     @id @default(uuid())
  name             String
  phone            String?    @unique
  email            String?    @unique
  address          String
  source           String
  status           LeadStatus @default(new)
  homeowner        Boolean?   @default(false)
  monthly_bill     Int?
  timeline         String?
  interest_score   Int?       @db.SmallInt
  last_contact     DateTime?
  contact_attempts Int        @default(0)
  created_at       DateTime   @default(now())
  updated_at       DateTime   @updatedAt

  conversations Conversation[]
  appointments  Appointment[]

  @@index([status])
  @@index([created_at])
}

model Conversation {
  id           String    @id @default(uuid())
  lead_id      String
  lead         Lead      @relation(fields: [lead_id], references: [id], onDelete: Cascade)
  channel      Channel
  direction    Direction
  message      String
  ai_processed Boolean   @default(false)
  created_at   DateTime  @default(now())

  @@index([lead_id, created_at])
}

model Appointment {
  id                String     @id @default(uuid())
  lead_id           String
  lead              Lead       @relation(fields: [lead_id], references: [id], onDelete: Cascade)
  calendly_event_id String?
  scheduled_at      DateTime?
  status            ApptStatus @default(scheduled)
  reminder_sent     Boolean    @default(false)
  created_at        DateTime   @default(now())

  @@index([lead_id])
  @@index([status])
}
EOF

# Config files
cat > src/config/env.ts << 'EOF'
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  OPENAI_API_KEY: z.string(),
  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  CALENDLY_API_KEY: z.string(),
  CALENDLY_EVENT_TYPE_UUID: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z.string().default("changeme"),
  MAILGUN_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
EOF

cat > src/config/logger.ts << 'EOF'
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});
EOF

# Middleware
cat > src/middleware/errorHandler.ts << 'EOF'
import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ msg: "error", error: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({ error: { message: err.message || "Internal Server Error" } });
};
EOF

cat > src/middleware/requestLogger.ts << 'EOF'
import type { RequestHandler } from "express";
import { logger } from "../config/logger.js";

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.info({ msg: "request", method: req.method, url: req.url, ip: req.ip });
  next();
};
EOF

cat > src/middleware/security.ts << 'EOF'
import type { RequestHandler } from "express";

export const securityMiddleware: RequestHandler = (req, _res, next) => {
  // Simple input sanitization: trim strings and strip control chars
  if (req.body && typeof req.body === "object") {
    for (const k of Object.keys(req.body)) {
      const v = req.body[k];
      if (typeof v === "string") {
        req.body[k] = v.replace(/[\x00-\x1F\x7F]/g, "").trim();
      }
    }
  }
  next();
};
EOF

# Services
cat > src/services/prisma.ts << 'EOF'
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
EOF

cat > src/services/templates.ts << 'EOF'
export const templates = {
  initial:
    "Hi {name}! Thanks for your interest in solar. I'm {ai_name}, your solar advisor. Quick question - do you own your home at {address}? Reply YES or NO",
  homeowner_yes:
    "Perfect! Solar can save homeowners a lot. What's your average monthly electric bill? (Just the dollar amount is fine)",
  homeowner_no:
    "Thanks for letting me know! Unfortunately, solar installations require homeownership. Would you like info on community solar programs instead?",
  qualified:
    "Based on your {bill}/month bill, you could save {savings}/year with solar! Want to see exact numbers? I can get you a free consultation. Reply BOOK to schedule.",
  appointment_confirm:
    "Your solar consultation is confirmed for {date} at {time}. We'll call you at {phone}. Reply CANCEL if you need to reschedule.",
};
EOF

cat > src/services/twilio.ts << 'EOF'
import Twilio from "twilio";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { templates } from "./templates.js";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function lookupPhone(phone: string) {
  return client.lookups.v2.phoneNumbers(phone).fetch({ fields: ["line_type_intelligence"] });
}

export async function sendSms(to: string, body: string) {
  return client.messages.create({ to, from: env.TWILIO_PHONE_NUMBER, body });
}

export async function sendInitialContact(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) return;

  const msg = templates.initial
    .replace("{name}", lead.name)
    .replace("{ai_name}", "SOLAI")
    .replace("{address}", lead.address);

  await sendSms(lead.phone, msg);
}
EOF

cat > src/services/openai.ts << 'EOF'
import OpenAI from "openai";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const openAiFunctions = [
  {
    name: "qualify_lead",
    description: "Qualify a solar lead based on responses",
    parameters: {
      type: "object",
      properties: {
        is_homeowner: { type: "boolean" },
        monthly_bill: { type: "number" },
        timeline: {
          type: "string",
          enum: ["immediate", "3-6_months", "6-12_months", "exploring"],
        },
        interest_level: { type: "integer", minimum: 1, maximum: 10 },
      },
    },
  },
  {
    name: "book_appointment",
    description: "Book a solar consultation appointment",
    parameters: {
      type: "object",
      properties: {
        preferred_date: { type: "string" },
        preferred_time: { type: "string" },
        contact_method: { type: "string", enum: ["phone", "video"] },
      },
    },
  },
];

export async function processMessageWithAI(leadId: string, messageId: string) {
  // Phase 1 stub: mark message queued for AI; Phase 2 will implement full convo
  await prisma.conversation.update({ where: { id: messageId }, data: { ai_processed: true } });
}
EOF

cat > src/services/calendly.ts << 'EOF'
import axios from "axios";
import { env } from "../config/env.js";

const api = axios.create({
  baseURL: "https://api.calendly.com",
  headers: { Authorization: `Bearer ${env.CALENDLY_API_KEY}` },
});

export async function fetchAvailability() {
  // Placeholder for availability using event type
  const res = await api.get(`/event_types/${env.CALENDLY_EVENT_TYPE_UUID}`);
  return res.data;
}

export async function handleCalendlyEvent(payload: any) {
  // Upsert appointment records based on invitee.created / canceled / rescheduled
  return payload;
}
EOF

cat > src/services/queue.ts << 'EOF'
import Bull from "bull";
import { env } from "../config/env.js";

export const initialContactQueue = new Bull("initial-contact", env.REDIS_URL);
export const aiProcessQueue = new Bull("ai-process", env.REDIS_URL);
export const remindersQueue = new Bull("reminders", env.REDIS_URL);
EOF

# Utilities
cat > src/utils/phone.ts << 'EOF'
export function normalizePhone(input: string): string {
  return input.replace(/[^\d+]/g, "");
}
EOF

cat > src/utils/email.ts << 'EOF'
import validator from "email-validator";

export const isValidEmail = (email: string): boolean => validator.validate(email);
EOF

# Routes
cat > src/api/routes/health.ts << 'EOF'
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => res.json({ status: "ok" }));

export default router;
EOF

cat > src/api/routes/leads.ts << 'EOF'
import { Router } from "express";
import * as leads from "../controllers/leads.controller.js";

const router = Router();

router.post("/intake", leads.intake);
router.get("/", leads.list);
router.get("/:id", leads.get);
router.patch("/:id", leads.update);

export default router;
EOF

cat > src/api/routes/webhooks.ts << 'EOF'
import { Router } from "express";
import * as wh from "../controllers/webhooks.controller.js";

const router = Router();

router.post("/twilio", wh.twilioSms);
router.post("/calendly", wh.calendly);

export default router;
EOF

cat > src/api/routes/index.ts << 'EOF'
import { Router } from "express";
import health from "./health.js";
import leads from "./leads.js";
import webhooks from "./webhooks.js";

const router = Router();

router.use("/health", health);
router.use("/leads", leads);
router.use("/webhooks", webhooks);

export default router;
EOF

# Controllers
cat > src/api/controllers/leads.controller.ts << 'EOF'
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../services/prisma.js";
import { normalizePhone } from "../../utils/phone.js";
import { isValidEmail } from "../../utils/email.js";
import { lookupPhone } from "../../services/twilio.js";
import { initialContactQueue } from "../../services/queue.js";

const IntakeSchema = z.object({
  name: z.string().min(2),
  phone: z.string(),
  email: z.string().optional(),
  address: z.string().min(5),
  source: z.string().min(1),
  monthly_bill: z.number().int().positive().optional(),
});

export const intake: RequestHandler = async (req, res, next) => {
  try {
    const input = IntakeSchema.parse(req.body);
    const phone = normalizePhone(input.phone);
    const email = input.email?.toLowerCase().trim();

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: { message: "Invalid email" } });
    }

    // Twilio Lookup
    const lookup = await lookupPhone(phone);
    if (!lookup || !lookup.valid) {
      return res.status(400).json({ error: { message: "Invalid phone" } });
    }

    // Dedup by phone or email
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [{ phone }, email ? { email } : undefined].filter(Boolean) as any,
      },
    });

    if (existing) {
      return res.status(200).json({ lead_id: existing.id, deduped: true });
    }

    const lead = await prisma.lead.create({
      data: {
        name: input.name.trim(),
        phone,
        email: email ?? null,
        address: input.address.trim(),
        source: input.source.trim(),
        monthly_bill: input.monthly_bill ?? null,
        status: "new",
      },
    });

    // Trigger initial workflow
    await initialContactQueue.add({ leadId: lead.id });

    res.status(201).json({ lead_id: lead.id });
  } catch (e) {
    next(e);
  }
};

export const get: RequestHandler = async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) {
      return res.status(404).json({ error: { message: "Not found" } });
    }
    res.json(lead);
  } catch (e) {
    next(e);
  }
};

export const list: RequestHandler = async (req, res, next) => {
  try {
    const { status, source, from, to } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (from || to) {
      where.created_at = {
        gte: from ? new Date(from as string) : undefined,
        lte: to ? new Date(to as string) : undefined,
      };
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 200,
    });

    res.json(leads);
  } catch (e) {
    next(e);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const data = req.body;
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data });
    res.json(lead);
  } catch (e) {
    next(e);
  }
};
EOF

cat > src/api/controllers/webhooks.controller.ts << 'EOF'
import type { RequestHandler } from "express";
import { prisma } from "../../services/prisma.js";
import { aiProcessQueue } from "../../services/queue.js";
import { handleCalendlyEvent } from "../../services/calendly.js";

// Validate Twilio signature (basic)
function isTwilioRequest(req: any): boolean {
  const signature = req.headers["x-twilio-signature"];
  return Boolean(signature); // TODO: Phase 2 - implement full signature validation
}

export const twilioSms: RequestHandler = async (req, res, next) => {
  try {
    if (!isTwilioRequest(req)) {
      return res.status(403).send("Forbidden");
    }

    const from = req.body.From;
    const body = (req.body.Body || "").toString();

    const lead = await prisma.lead.findFirst({ where: { phone: from } });
    if (!lead) {
      return res.status(200).send("OK");
    }

    const convo = await prisma.conversation.create({
      data: { lead_id: lead.id, channel: "sms", direction: "inbound", message: body },
    });

    await aiProcessQueue.add({ leadId: lead.id, messageId: convo.id });

    res.status(200).send("OK");
  } catch (e) {
    next(e);
  }
};

export const calendly: RequestHandler = async (req, res, next) => {
  try {
    await handleCalendlyEvent(req.body);
    res.status(200).send("OK");
  } catch (e) {
    next(e);
  }
};
EOF

# Worker
cat > src/worker/index.ts << 'EOF'
import "dotenv/config";
import { initialContactQueue, aiProcessQueue, remindersQueue } from "../services/queue.js";
import { sendInitialContact } from "../services/twilio.js";
import { processMessageWithAI } from "../services/openai.js";
import { logger } from "../config/logger.js";

logger.info({ msg: "Worker starting..." });

initialContactQueue.process(5, async (job) => {
  await sendInitialContact(job.data.leadId);
});

aiProcessQueue.process(5, async (job) => {
  await processMessageWithAI(job.data.leadId, job.data.messageId);
});

remindersQueue.process(5, async (_job) => {
  // Stub for reminders
  return;
});

logger.info({ msg: "Worker ready", queues: ["initial-contact", "ai-process", "reminders"] });
EOF

# Main index
cat > src/index.ts << 'EOF'
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requestLogger } from "./middleware/requestLogger.js";
import { securityMiddleware } from "./middleware/security.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./api/routes/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(securityMiddleware);
app.use(requestLogger);

app.use("/api", routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ msg: "API listening", port: env.PORT, env: env.NODE_ENV });
});

export default app;
EOF

echo "✅ Backend source files created!"
echo ""
echo "Next steps:"
echo "1. cd backend && npm install"
echo "2. Copy ../.env.template to ../.env and fill in API keys"
echo "3. npx prisma generate"
echo "4. npx prisma migrate dev --name init"
echo "5. npm run dev"
EOF

chmod +x setup-backend.sh

echo "✅ Setup script created at setup-backend.sh"
echo "Run: ./setup-backend.sh"

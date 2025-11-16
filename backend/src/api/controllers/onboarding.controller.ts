import type { RequestHandler } from "express";
import { z } from "zod";
import { logger } from "../../config/logger.js";

// Minimal schema capturing all fields as a structured object; extend as needed
export const OnboardingFormSchema = z.object({
  brand: z.object({
    legalName: z.string(),
    dba: z.string().optional(),
    taxId: z.string(),
    registrationCountry: z.string().default("US"),
    businessType: z.string(),
    industry: z.string().default("Energy/Solar"),
    website: z.string().url(),
    address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string().default("US"),
    }),
    supportEmail: z.string().email(),
    supportPhone: z.string(),
    stockSymbol: z.string().optional(),
  }),
  representative: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  messaging: z.object({
    useCase: z.enum(["conversational", "marketing", "low_volume_mixed"]),
    description: z.string(),
    sampleMessages: z.array(z.string()).min(1),
    termsUrl: z.string().url(),
    privacyUrl: z.string().url(),
    optIn: z.object({
      formUrls: z.array(z.string().url()).min(1),
      screenshotsLinks: z.array(z.string().url()).optional(),
      disclosureText: z.string(),
      frequency: z.string(),
    }),
    helpResponse: z.string(),
    stopKeywords: z.array(z.string()).default([
      "STOP",
      "STOP ALL",
      "UNSUBSCRIBE",
      "CANCEL",
      "END",
      "QUIT",
    ]),
    helpKeywords: z.array(z.string()).default(["HELP"]),
  }),
  compliance: z.object({
    quietHours: z.string().optional(),
    dncSuppressionProcess: z.string(),
    prohibitedContentPolicy: z.string(),
  }),
  numbers: z.object({
    senderNumbers: z.array(z.string()).optional(),
    areaPreferences: z.array(z.string()).optional(),
    expectedDaily: z.number().int().nonnegative(),
    expectedMonthly: z.number().int().nonnegative(),
  }),
}).strict();

// In this first iteration, we simply log and emit a minimal response.
// Later we can store to DB (Prisma) or Notion, or email to ops.
export const submit: RequestHandler = async (req, res, next) => {
  try {
    const data = OnboardingFormSchema.parse(req.body);
    logger.info({ msg: "Onboarding submission received", brand: data.brand.legalName });
    res.status(200).json({ ok: true });
  } catch (e) {
    next(e);
  }
};
import type { RequestHandler } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const DemoOnboardingSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

export const onboarding: RequestHandler = async (req, res, next) => {
  try {
    const input = DemoOnboardingSchema.parse(req.body);

    if (env.DEMO_MODE) {
      // Safe stub mode: no external calls, just return success
      const leadId = uuid();
      logger.info({
        msg: "Demo lead created (stub mode)",
        leadId,
        name: input.name,
        phone: input.phone,
      });

      return res.status(201).json({
        success: true,
        lead_id: leadId,
        source: "DEMO",
        name: input.name,
        phone: input.phone,
        email: input.email,
        message: "Demo lead created successfully (no external services called)",
      });
    }

    // Production mode: could call real intake endpoint or service
    // For now, return a similar response but indicate it would be real
    const leadId = uuid();
    logger.warn({
      msg: "Demo endpoint called with DEMO_MODE=false - consider using /api/leads/intake instead",
      leadId,
    });

    res.status(201).json({
      success: true,
      lead_id: leadId,
      source: "DEMO",
      name: input.name,
      phone: input.phone,
      email: input.email,
      message: "Demo lead created (DEMO_MODE is false; consider using production intake)",
    });
  } catch (e) {
    next(e);
  }
};

export const ping: RequestHandler = (_req, res) => {
  res.json({ ok: true, demo_mode: env.DEMO_MODE });
};

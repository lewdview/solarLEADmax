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

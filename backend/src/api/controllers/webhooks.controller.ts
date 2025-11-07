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

import type { RequestHandler } from "express";
import { prisma } from "../../services/prisma.js";
import { aiProcessQueue } from "../../services/queue.js";
import { handleCalendlyEvent } from "../../services/calendly.js";
import { validateTwilioSignature } from "../../services/twilio.js";
import Twilio from "twilio";

export const twilioSms: RequestHandler = async (req, res, next) => {
  try {
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const signature = req.headers["x-twilio-signature"] as string | undefined;
    if (!validateTwilioSignature(url, req.body, signature)) {
      return res.status(403).send("Forbidden");
    }

    const from = req.body.From;
    const body = (req.body.Body || "").toString();

    const lead = await prisma.lead.findFirst({ where: { phone: from } });
    if (!lead) {
      return res.status(200).send("OK");
    }

    // STOP handling
    if (/^\s*(STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT)\s*$/i.test(body)) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "dead" } });
      await prisma.conversation.create({
        data: { lead_id: lead.id, channel: "sms", direction: "inbound", message: body },
      });
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

export const twilioStatus: RequestHandler = async (req, res, next) => {
  try {
    // Optional: validate signature
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const signature = req.headers["x-twilio-signature"] as string | undefined;
    if (!validateTwilioSignature(url, req.body, signature)) {
      return res.status(403).send("Forbidden");
    }

    // Log delivery status; could be stored if schema supports it
    // Example fields: MessageSid, MessageStatus, To, From
    res.status(200).send("OK");
  } catch (e) {
    next(e);
  }
};

export const twilioVoiceTwiML: RequestHandler = async (req, res, next) => {
  try {
    const leadId = (req.query.leadId as string) || "";
    const lead = leadId
      ? await prisma.lead.findUnique({ where: { id: leadId } })
      : null;

    const twiml = new Twilio.twiml.VoiceResponse();

    const greeting = lead
      ? `Hi ${lead.name}, this is your solar advisor from SolarLEADmax.`
      : `Hello, this is your solar advisor from SolarLEADmax.`;

    twiml.say({ voice: "polly.Joanna" }, greeting);
    twiml.pause({ length: 1 });
    twiml.say(
      { voice: "polly.Joanna" },
      "We ran your numbers and it looks like you could save significantly with solar."
    );
    twiml.pause({ length: 1 });
    twiml.say(
      { voice: "polly.Joanna" },
      "If now is a good time, press 1 to connect with a specialist. To schedule later, press 2."
    );
    twiml.gather({ numDigits: 1, timeout: 6 });

    res.type("text/xml").send(twiml.toString());
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

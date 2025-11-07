import Twilio from "twilio";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { templates } from "./templates.js";
import { storeConversationMessage } from "./conversationContext.js";

const client = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export function validateTwilioSignature(url: string, params: any, signature?: string) {
  try {
    return Twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature || "", url, params);
  } catch {
    return false;
  }
}

export async function lookupPhone(phone: string) {
  return client.lookups.v2.phoneNumbers(phone).fetch({ fields: ["line_type_intelligence"] });
}

export async function sendSms(to: string, body: string) {
  return client.messages.create({ to, from: env.TWILIO_PHONE_NUMBER, body });
}

export async function sendSmsToLead(leadId: string, body: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) return;
  const res = await sendSms(lead.phone, body);
  await storeConversationMessage(leadId, body, "outbound", "sms", true);
  return res;
}

export async function sendInitialContact(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) return;
  const msg = templates.initial
    .replace("{name}", lead.name)
    .replace("{ai_name}", "SOLAI")
    .replace("{address}", lead.address);
  await sendSmsToLead(lead.id, msg);
}

// Voice calling for hot leads (max 2 attempts)
export async function initiateHotLeadCall(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead?.phone) return;

  // Limit to 2 voice attempts
  const attempts = await prisma.conversation.count({
    where: { lead_id: leadId, channel: "voice", direction: "outbound" },
  });
  if (attempts >= 2) return;

  const callbackUrl = `${process.env.PUBLIC_API_BASE_URL || ""}/api/webhooks/twilio/voice?leadId=${leadId}`;

  await client.calls.create({
    to: lead.phone,
    from: env.TWILIO_PHONE_NUMBER,
    url: callbackUrl,
    machineDetection: "Enable", // basic AMD
  });

  await storeConversationMessage(
    leadId,
    "Initiated outbound voice call",
    "outbound",
    "voice",
    true
  );
}
  await sendSms(lead.phone, msg);
}

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

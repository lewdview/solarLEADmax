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

/**
 * OpenAI GPT-4o Qualification Engine
 * 
 * Complete AI conversation engine with function calling for solar lead qualification.
 * Handles conversation context, qualification logic, and auto-routing.
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { logger } from "../config/logger.js";
import { sendSms } from "./twilio.js";
import {
  getConversationContext,
  formatConversationForOpenAI,
  storeConversationMessage,
  analyzeConversationState,
  buildLeadSummary,
  detectHomeownerStatus,
  extractBillAmount,
  detectTimeline,
  assessEngagement,
  needsHumanEscalation,
} from "./conversationContext.js";
import {
  SYSTEM_PROMPT,
  QUALIFICATION_PROMPTS,
  calculateEstimatedSavings,
  calculateInterestScore,
  isQualified,
} from "./prompts.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * OpenAI Function Definitions for Lead Qualification
 */
export const openAiFunctions: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function[] = [
  {
    name: "qualify_lead",
    description:
      "Call this function when you have determined the lead's homeowner status, monthly electric bill, timeline, and interest level. This updates the lead record with qualification data.",
    parameters: {
      type: "object",
      properties: {
        is_homeowner: {
          type: "boolean",
          description: "Whether the lead owns their home (true) or rents/leases (false)",
        },
        monthly_bill: {
          type: "number",
          description: "Average monthly electric bill in dollars (e.g., 150 for $150/month)",
        },
        timeline: {
          type: "string",
          enum: ["immediate", "3-6_months", "6-12_months", "exploring"],
          description:
            "Timeline for going solar: immediate (now-3mo), 3-6_months, 6-12_months, or exploring (no timeline)",
        },
        interest_level: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description:
            "Interest score 1-10 based on enthusiasm, budget, timeline. 8-10=hot, 5-7=warm, 1-4=cold",
        },
      },
      required: ["is_homeowner"],
    },
  },
  {
    name: "book_appointment",
    description:
      "Call this function when the lead wants to book a consultation appointment. Only call after lead is qualified (homeowner + interested).",
    parameters: {
      type: "object",
      properties: {
        preferred_date: {
          type: "string",
          description: "Preferred date for appointment (e.g., 'next week', 'Monday', '2024-01-15')",
        },
        preferred_time: {
          type: "string",
          description: "Preferred time slot (e.g., 'morning', 'afternoon', '2pm', 'flexible')",
        },
        contact_method: {
          type: "string",
          enum: ["phone", "video"],
          description: "Preferred consultation method: phone or video call",
        },
      },
      required: ["contact_method"],
    },
  },
  {
    name: "mark_unqualified",
    description:
      "Call this function when lead is NOT qualified for solar (not a homeowner, very low bill <$50, or explicitly not interested).",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for disqualification (e.g., 'not_homeowner', 'bill_too_low', 'not_interested')",
        },
      },
      required: ["reason"],
    },
  },
];

/**
 * Main AI conversation processing function
 * Processes inbound messages and generates AI responses with function calling
 */
export async function processMessageWithAI(
  leadId: string,
  messageId: string
): Promise<void> {
  try {
    logger.info({ msg: "Processing message with AI", leadId, messageId });

    // Get full conversation context
    const context = await getConversationContext(leadId);
    const { lead, conversationHistory } = context;

    // Check if human escalation needed
    if (needsHumanEscalation(context)) {
      logger.warn({ msg: "Human escalation needed", leadId });
      await storeConversationMessage(
        leadId,
        "[ESCALATED] This conversation needs human review.",
        "outbound",
        "sms",
        true
      );
      // TODO: Trigger human notification
      return;
    }

    // Get conversation state
    const state = analyzeConversationState(context);
    logger.info({ msg: "Conversation state", leadId, state: state.state });

    // Build context for AI
    const leadSummary = buildLeadSummary(context);
    const systemPrompt = `${SYSTEM_PROMPT}\n\n**Current Lead Information:**\n${leadSummary}`;

    // Format messages for OpenAI
    const messages = formatConversationForOpenAI(
      context,
      systemPrompt
    ) as ChatCompletionMessageParam[];

    // Add latest user message if not already in history
    const latestConversation = await prisma.conversation.findUnique({
      where: { id: messageId },
    });

    if (latestConversation && latestConversation.direction === "inbound") {
      // Quick extraction before AI call (for efficiency)
      const userMessage = latestConversation.message;
      
      // Extract data from message
      const detectedHomeowner = detectHomeownerStatus(userMessage);
      const detectedBill = extractBillAmount(userMessage);
      const detectedTimeline = detectTimeline(userMessage);
      const engagement = assessEngagement(userMessage);

      // Update lead with extracted data (optimistic update)
      const updateData: any = {};
      if (detectedHomeowner !== null && lead.homeowner === null) {
        updateData.homeowner = detectedHomeowner;
      }
      if (detectedBill !== null && !lead.monthly_bill) {
        updateData.monthly_bill = detectedBill;
      }
      if (detectedTimeline !== null && !lead.timeline) {
        updateData.timeline = detectedTimeline;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.lead.update({ where: { id: leadId }, data: updateData });
        logger.info({ msg: "Lead data extracted", leadId, updateData });
      }
    }

    // Call OpenAI with function calling
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      functions: openAiFunctions,
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 200, // Keep responses concise for SMS
    });

    const aiMessage = response.choices[0]?.message;

    if (!aiMessage) {
      throw new Error("No response from OpenAI");
    }

    // Handle function calls
    if (aiMessage.function_call) {
      await handleFunctionCall(leadId, aiMessage.function_call);
    }

    // Send AI response via SMS
    if (aiMessage.content && lead.phone) {
      await sendSms(lead.phone, aiMessage.content);
      await storeConversationMessage(leadId, aiMessage.content, "outbound", "sms", true);

      logger.info({
        msg: "AI response sent",
        leadId,
        responseLength: aiMessage.content.length,
        hadFunctionCall: !!aiMessage.function_call,
      });
    }

    // Mark original message as processed
    await prisma.conversation.update({
      where: { id: messageId },
      data: { ai_processed: true },
    });
  } catch (error) {
    logger.error({ msg: "AI processing error", leadId, error });
    throw error;
  }
}

/**
 * Handles OpenAI function calls
 */
async function handleFunctionCall(
  leadId: string,
  functionCall: OpenAI.Chat.Completions.ChatCompletionMessage.FunctionCall
): Promise<void> {
  const { name, arguments: argsString } = functionCall;
  const args = JSON.parse(argsString);

  logger.info({ msg: "Function called", leadId, function: name, args });

  switch (name) {
    case "qualify_lead":
      await handleQualifyLead(leadId, args);
      break;

    case "book_appointment":
      await handleBookAppointment(leadId, args);
      break;

    case "mark_unqualified":
      await handleMarkUnqualified(leadId, args);
      break;

    default:
      logger.warn({ msg: "Unknown function call", leadId, function: name });
  }
}

/**
 * Handles qualify_lead function call
 */
async function handleQualifyLead(
  leadId: string,
  args: {
    is_homeowner: boolean;
    monthly_bill?: number;
    timeline?: string;
    interest_level?: number;
  }
): Promise<void> {
  const { is_homeowner, monthly_bill, timeline, interest_level } = args;

  // Calculate final interest score
  const engagement = interest_level || 5;
  const calculatedScore = calculateInterestScore(
    is_homeowner,
    monthly_bill || null,
    timeline || null,
    engagement
  );

  // Determine new status based on qualification
  let newStatus: "contacted" | "qualified" | "dead" = "contacted";

  if (!is_homeowner) {
    newStatus = "dead";
  } else if (isQualified(is_homeowner, monthly_bill || null, calculatedScore)) {
    newStatus = "qualified";
  }

  // Update lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      homeowner: is_homeowner,
      monthly_bill: monthly_bill || null,
      timeline: timeline || null,
      interest_score: calculatedScore,
      status: newStatus,
    },
  });

  logger.info({
    msg: "Lead qualified",
    leadId,
    homeowner: is_homeowner,
    bill: monthly_bill,
    timeline,
    score: calculatedScore,
    status: newStatus,
  });

  // If hot lead (8-10), trigger booking flow
  if (calculatedScore >= 8 && is_homeowner) {
    // AI should automatically offer booking in its response
    logger.info({ msg: "Hot lead detected - booking flow recommended", leadId });
    try {
      const { initiateHotLeadCall } = await import("./twilio.js");
      await initiateHotLeadCall(leadId);
    } catch (err) {
      logger.error({ msg: "Failed to initiate hot lead call", leadId, err });
    }
  }
}

/**
 * Handles book_appointment function call
 */
async function handleBookAppointment(
  leadId: string,
  args: {
    preferred_date?: string;
    preferred_time?: string;
    contact_method: string;
  }
): Promise<void> {
  const { preferred_date, preferred_time, contact_method } = args;

  // Create appointment record
  await prisma.appointment.create({
    data: {
      lead_id: leadId,
      status: "scheduled",
      // TODO: Integrate with Calendly to get actual scheduled_at time
    },
  });

  // Update lead status
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "appointment_set" },
  });

  logger.info({
    msg: "Appointment booking initiated",
    leadId,
    preferred_date,
    preferred_time,
    contact_method,
  });

  // TODO: Call Calendly API to create actual event
  // TODO: Send confirmation SMS with appointment details
}

/**
 * Handles mark_unqualified function call
 */
async function handleMarkUnqualified(
  leadId: string,
  args: { reason: string }
): Promise<void> {
  const { reason } = args;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "dead",
      interest_score: 1,
    },
  });

  logger.info({ msg: "Lead marked unqualified", leadId, reason });
}

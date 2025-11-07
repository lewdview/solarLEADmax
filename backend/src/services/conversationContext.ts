/**
 * Conversation Context Manager
 * 
 * Manages conversation history, context retrieval, and state tracking
 * for AI-powered lead qualification conversations.
 */

import type { Lead, Conversation } from "@prisma/client";
import { prisma } from "./prisma.js";
import { logger } from "../config/logger.js";

export interface ConversationMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export interface LeadContext {
  lead: Lead;
  conversationHistory: ConversationMessage[];
  lastContactAt: Date | null;
  totalMessages: number;
  hasActiveConversation: boolean;
}

/**
 * Retrieves full conversation context for a lead
 */
export async function getConversationContext(leadId: string): Promise<LeadContext> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: {
        orderBy: { created_at: "asc" },
        take: 50, // Last 50 messages max
      },
    },
  });

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  // Build conversation history in OpenAI format
  const conversationHistory: ConversationMessage[] = lead.conversations.map((conv) => ({
    role: conv.direction === "inbound" ? "user" : "assistant",
    content: conv.message,
    timestamp: conv.created_at,
  }));

  return {
    lead,
    conversationHistory,
    lastContactAt: lead.last_contact,
    totalMessages: lead.conversations.length,
    hasActiveConversation: conversationHistory.length > 0,
  };
}

/**
 * Formats conversation history for OpenAI API
 */
export function formatConversationForOpenAI(
  context: LeadContext,
  systemPrompt: string
): ConversationMessage[] {
  const messages: ConversationMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Add conversation history
  messages.push(...context.conversationHistory);

  return messages;
}

/**
 * Stores a new conversation message
 */
export async function storeConversationMessage(
  leadId: string,
  message: string,
  direction: "inbound" | "outbound",
  channel: "sms" | "email" | "voice" = "sms",
  aiProcessed: boolean = false
): Promise<Conversation> {
  const conversation = await prisma.conversation.create({
    data: {
      lead_id: leadId,
      channel,
      direction,
      message,
      ai_processed: aiProcessed,
    },
  });

  // Update lead's last_contact timestamp
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      last_contact: new Date(),
      contact_attempts: direction === "outbound" ? { increment: 1 } : undefined,
    },
  });

  logger.info({
    msg: "Conversation message stored",
    leadId,
    direction,
    channel,
    messageLength: message.length,
  });

  return conversation;
}

/**
 * Determines conversation state and next action
 */
export function analyzeConversationState(context: LeadContext): {
  state: "new" | "qualifying" | "qualified" | "booking" | "dead" | "complete";
  needsResponse: boolean;
  suggestedAction: string;
} {
  const { lead, conversationHistory } = context;

  // New lead with no conversation
  if (conversationHistory.length === 0) {
    return {
      state: "new",
      needsResponse: true,
      suggestedAction: "Send initial greeting and ask about home ownership",
    };
  }

  // Check if lead is qualified
  const isQualified = lead.homeowner === true && (lead.monthly_bill ?? 0) >= 75;

  // Check if appointment is set
  if (lead.status === "appointment_set") {
    return {
      state: "complete",
      needsResponse: false,
      suggestedAction: "Wait for appointment confirmation",
    };
  }

  // Check if lead is disqualified
  if (lead.homeowner === false || lead.status === "dead") {
    return {
      state: "dead",
      needsResponse: false,
      suggestedAction: "No further action needed",
    };
  }

  // Lead is in qualification process
  if (!lead.homeowner || !lead.monthly_bill || !lead.timeline) {
    return {
      state: "qualifying",
      needsResponse: true,
      suggestedAction: "Continue qualification questions",
    };
  }

  // Lead is qualified and ready for booking
  if (isQualified && lead.interest_score && lead.interest_score >= 7) {
    return {
      state: "booking",
      needsResponse: true,
      suggestedAction: "Offer appointment booking",
    };
  }

  // Lead is qualified but needs nurturing
  if (isQualified) {
    return {
      state: "qualified",
      needsResponse: true,
      suggestedAction: "Continue nurturing conversation",
    };
  }

  // Default: continue qualifying
  return {
    state: "qualifying",
    needsResponse: true,
    suggestedAction: "Ask next qualification question",
  };
}

/**
 * Extracts lead information from conversation context for AI prompt
 */
export function buildLeadSummary(context: LeadContext): string {
  const { lead } = context;

  const parts: string[] = [
    `Lead: ${lead.name}`,
    `Address: ${lead.address}`,
    `Source: ${lead.source}`,
  ];

  if (lead.homeowner !== null) {
    parts.push(`Homeowner: ${lead.homeowner ? "Yes" : "No"}`);
  }

  if (lead.monthly_bill) {
    parts.push(`Monthly Bill: $${lead.monthly_bill}`);
  }

  if (lead.timeline) {
    parts.push(`Timeline: ${lead.timeline}`);
  }

  if (lead.interest_score) {
    parts.push(`Interest Score: ${lead.interest_score}/10`);
  }

  parts.push(`Status: ${lead.status}`);
  parts.push(`Total Messages: ${context.totalMessages}`);

  return parts.join("\n");
}

/**
 * Detects if user message indicates homeowner status
 */
export function detectHomeownerStatus(message: string): boolean | null {
  const lowerMessage = message.toLowerCase().trim();

  // Positive indicators
  const yesPatterns = [
    /\b(yes|yeah|yep|yup|sure|correct|own|owner)\b/i,
    /\b(i do|we do|i own|we own)\b/i,
  ];

  // Negative indicators
  const noPatterns = [
    /\b(no|nope|nah|rent|renting|tenant|lease|leasing)\b/i,
    /\b(don't own|do not own|don't|do not)\b/i,
  ];

  for (const pattern of yesPatterns) {
    if (pattern.test(lowerMessage)) return true;
  }

  for (const pattern of noPatterns) {
    if (pattern.test(lowerMessage)) return false;
  }

  return null;
}

/**
 * Extracts dollar amount from user message
 */
export function extractBillAmount(message: string): number | null {
  // Match patterns like: $150, 150, $150/month, 150 dollars, etc.
  const patterns = [
    /\$?\s*(\d{1,4})\s*(?:\/mo|\/month|per month|dollars|bucks)?/i,
    /(?:about|around|roughly)\s*\$?\s*(\d{1,4})/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1], 10);
      // Sanity check: bill should be between $10 and $2000
      if (amount >= 10 && amount <= 2000) {
        return amount;
      }
    }
  }

  return null;
}

/**
 * Detects timeline from user message
 */
export function detectTimeline(
  message: string
): "immediate" | "3-6_months" | "6-12_months" | "exploring" | null {
  const lowerMessage = message.toLowerCase();

  // Immediate patterns
  if (
    /\b(now|asap|immediately|right away|this month|next month|soon|urgent)\b/i.test(
      lowerMessage
    )
  ) {
    return "immediate";
  }

  // 3-6 months
  if (
    /\b(3-6 months?|three to six months?|spring|summer|few months?)\b/i.test(lowerMessage) ||
    /\b(3|4|5|6)\s*months?\b/i.test(lowerMessage)
  ) {
    return "3-6_months";
  }

  // 6-12 months
  if (
    /\b(6-12 months?|six to twelve months?|fall|winter|next year|this year|end of year)\b/i.test(
      lowerMessage
    ) ||
    /\b(7|8|9|10|11|12)\s*months?\b/i.test(lowerMessage)
  ) {
    return "6-12_months";
  }

  // Exploring (no specific timeline)
  if (
    /\b(exploring|researching|learning|looking into|thinking about|considering|maybe|eventually|someday)\b/i.test(
      lowerMessage
    )
  ) {
    return "exploring";
  }

  return null;
}

/**
 * Assesses engagement level from message
 */
export function assessEngagement(message: string): number {
  // Score 1-10 based on message characteristics
  let score = 5; // Default neutral

  const lowerMessage = message.toLowerCase();
  const messageLength = message.length;

  // Positive indicators (increase score)
  if (/\b(interested|excited|great|perfect|awesome|amazing|love|want)\b/i.test(message))
    score += 2;
  if (/[!?]{2,}/.test(message)) score += 1; // Multiple punctuation = enthusiasm
  if (messageLength > 50) score += 1; // Detailed response = engaged
  if (/\b(when|how|what|where|tell me|show me)\b/i.test(message)) score += 1; // Questions = interested

  // Negative indicators (decrease score)
  if (/\b(not interested|no thanks|not sure|maybe later|don't think so)\b/i.test(lowerMessage))
    score -= 3;
  if (messageLength < 10) score -= 1; // Very short = low engagement
  if (/\b(busy|later|not now)\b/i.test(lowerMessage)) score -= 2;

  return Math.max(1, Math.min(10, score));
}

/**
 * Checks if conversation needs human intervention
 */
export function needsHumanEscalation(context: LeadContext): boolean {
  const { lead, conversationHistory } = context;

  // Escalate if lead has complex questions
  const lastMessages = conversationHistory.slice(-3);
  const hasComplexQuestion = lastMessages.some((msg) =>
    /\b(complaint|problem|issue|technical|lawsuit|legal|scam|fraud)\b/i.test(msg.content)
  );

  // Escalate if too many messages without progress
  if (conversationHistory.length > 15 && !lead.homeowner && !lead.monthly_bill) {
    return true;
  }

  // Escalate if lead explicitly asks for human
  const asksForHuman = lastMessages.some((msg) =>
    /\b(speak to|talk to|human|person|agent|representative|manager)\b/i.test(msg.content)
  );

  return hasComplexQuestion || asksForHuman;
}

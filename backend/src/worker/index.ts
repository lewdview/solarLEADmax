import "dotenv/config";
import { initialContactQueue, aiProcessQueue, remindersQueue } from "../services/queue.js";
import { sendInitialContact } from "../services/twilio.js";
import { processMessageWithAI } from "../services/openai.js";
import { logger } from "../config/logger.js";

logger.info({ msg: "Worker starting..." });

initialContactQueue.process(5, async (job) => {
  await sendInitialContact(job.data.leadId);
});

aiProcessQueue.process(5, async (job) => {
  await processMessageWithAI(job.data.leadId, job.data.messageId);
});

remindersQueue.process(5, async (_job) => {
  // Stub for reminders
  return;
});

logger.info({ msg: "Worker ready", queues: ["initial-contact", "ai-process", "reminders"] });

import Bull from "bull";
import { env } from "../config/env.js";

export const initialContactQueue = new Bull("initial-contact", env.REDIS_URL);
export const aiProcessQueue = new Bull("ai-process", env.REDIS_URL);
export const remindersQueue = new Bull("reminders", env.REDIS_URL);

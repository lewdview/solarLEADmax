import axios from "axios";
import { env } from "../config/env.js";
import { EmailSubjects, EmailTemplates, type EmailTemplateParams } from "./emailTemplates.js";

const MAILGUN_BASE = "https://api.mailgun.net/v3";

function mailgunAuthHeader() {
  const token = Buffer.from(`api:${env.MAILGUN_API_KEY || ""}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function sendMailgunEmail(to: string, subject: string, html: string, text?: string) {
  if (!env.MAILGUN_API_KEY || !env.MAILGUN_DOMAIN) {
    throw new Error("Mailgun not configured (MAILGUN_API_KEY/MAILGUN_DOMAIN)");
  }
  const from = env.EMAIL_FROM || `SolarLEADmax <noreply@${env.MAILGUN_DOMAIN}>`;
  const url = `${MAILGUN_BASE}/${env.MAILGUN_DOMAIN}/messages`;
  const params = new URLSearchParams();
  params.append("from", from);
  params.append("to", to);
  params.append("subject", subject);
  if (text) params.append("text", text);
  params.append("html", html);

  await axios.post(url, params, { headers: { ...mailgunAuthHeader(), "Content-Type": "application/x-www-form-urlencoded" } });
}

export async function sendWelcomeEmail(to: string, p: EmailTemplateParams) {
  const subject = EmailSubjects.welcome(p.leadName);
  const html = EmailTemplates.welcomeHTML(p).replace("{{BOOKING_LINK}}", p.bookingLink || "#");
  await sendMailgunEmail(to, subject, html);
}

export async function sendEducationalEmail(to: string, p: EmailTemplateParams) {
  const subject = EmailSubjects.edu();
  const html = EmailTemplates.eduHTML(p).replace("{{BOOKING_LINK}}", p.bookingLink || "#");
  await sendMailgunEmail(to, subject, html);
}

export async function sendCaseStudyEmail(to: string, p: EmailTemplateParams) {
  const subject = EmailSubjects.caseStudy();
  const html = EmailTemplates.caseStudyHTML(p).replace("{{BOOKING_LINK}}", p.bookingLink || "#");
  await sendMailgunEmail(to, subject, html);
}

export async function sendFinalCTAEmail(to: string, p: EmailTemplateParams) {
  const subject = EmailSubjects.finalCTA();
  const html = EmailTemplates.finalCTAHTML(p).replace("{{BOOKING_LINK}}", p.bookingLink || "#");
  await sendMailgunEmail(to, subject, html);
}

export async function sendAppointmentConfirmationEmail(to: string, p: EmailTemplateParams & { date: string; time: string; dial: string; }) {
  const subject = EmailSubjects.appointmentConfirm(p.date, p.time);
  const html = EmailTemplates.appointmentConfirmHTML(p, p.date, p.time, p.dial);
  await sendMailgunEmail(to, subject, html);
}

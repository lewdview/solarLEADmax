import axios from "axios";
import { env } from "../config/env.js";

const api = axios.create({
  baseURL: "https://api.calendly.com",
  headers: { Authorization: `Bearer ${env.CALENDLY_API_KEY}` },
});

export async function fetchAvailability() {
  // Placeholder for availability using event type
  const res = await api.get(`/event_types/${env.CALENDLY_EVENT_TYPE_UUID}`);
  return res.data;
}

export async function handleCalendlyEvent(payload: any) {
  // Upsert appointment records based on invitee.created / canceled / rescheduled
  return payload;
}

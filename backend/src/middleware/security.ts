import type { RequestHandler } from "express";

export const securityMiddleware: RequestHandler = (req, _res, next) => {
  // Simple input sanitization: trim strings and strip control chars
  if (req.body && typeof req.body === "object") {
    for (const k of Object.keys(req.body)) {
      const v = req.body[k];
      if (typeof v === "string") {
        req.body[k] = v.replace(/[\x00-\x1F\x7F]/g, "").trim();
      }
    }
  }
  next();
};

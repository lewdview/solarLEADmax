import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ msg: "error", error: err.message, stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({ error: { message: err.message || "Internal Server Error" } });
};

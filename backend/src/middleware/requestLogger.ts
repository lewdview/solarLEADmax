import type { RequestHandler } from "express";
import { logger } from "../config/logger.js";

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.info({ msg: "request", method: req.method, url: req.url, ip: req.ip });
  next();
};

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { requestLogger } from "./middleware/requestLogger.js";
import { securityMiddleware } from "./middleware/security.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./api/routes/index.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(","), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(securityMiddleware);
app.use(requestLogger);

// Serve static onboarding form (and any other static assets) from backend/public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to backend/public regardless of dev or build output location
const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

// Friendly route to serve the form at /onboarding
app.get("/onboarding", (_req, res) => {
  res.sendFile(path.join(publicDir, "onboarding.html"));
});
// Friendly route to serve the progress one-pager at /progress
app.get("/progress", (_req, res) => {
  res.sendFile(path.join(publicDir, "progress.html"));
});
// Friendly route to serve the demo page at /demo
app.get("/demo", (_req, res) => {
  res.sendFile(path.join(publicDir, "demo", "index.html"));
});

app.use("/api", routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ msg: "API listening", port: env.PORT, env: env.NODE_ENV });
});

export default app;

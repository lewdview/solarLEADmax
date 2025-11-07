import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
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

app.use("/api", routes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  logger.info({ msg: "API listening", port: env.PORT, env: env.NODE_ENV });
});

export default app;

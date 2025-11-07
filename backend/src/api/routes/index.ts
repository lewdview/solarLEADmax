import { Router } from "express";
import health from "./health.js";
import leads from "./leads.js";
import webhooks from "./webhooks.js";

const router = Router();

router.use("/health", health);
router.use("/leads", leads);
router.use("/webhooks", webhooks);

export default router;

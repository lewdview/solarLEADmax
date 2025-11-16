import { Router } from "express";
import health from "./health.js";
import leads from "./leads.js";
import webhooks from "./webhooks.js";
import onboarding from "./onboarding.js";

const router = Router();

router.use("/health", health);
router.use("/leads", leads);
router.use("/webhooks", webhooks);
router.use("/onboarding", onboarding);

export default router;

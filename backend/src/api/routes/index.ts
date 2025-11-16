import { Router } from "express";
import health from "./health.js";
import leads from "./leads.js";
import webhooks from "./webhooks.js";
import onboarding from "./onboarding.js";
import demo from "./demo.js";

const router = Router();

router.use("/health", health);
router.use("/leads", leads);
router.use("/webhooks", webhooks);
router.use("/onboarding", onboarding);
router.use("/demo", demo);

export default router;

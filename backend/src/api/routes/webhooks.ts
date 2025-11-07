import { Router } from "express";
import * as wh from "../controllers/webhooks.controller.js";

const router = Router();

router.post("/twilio", wh.twilioSms);
router.post("/twilio/status", wh.twilioStatus);
router.all("/twilio/voice", wh.twilioVoiceTwiML);
router.post("/calendly", wh.calendly);

export default router;

import { Router } from "express";
import * as demoController from "../controllers/demo.controller.js";

const router = Router();

router.post("/onboarding", demoController.onboarding);
router.get("/ping", demoController.ping);

export default router;

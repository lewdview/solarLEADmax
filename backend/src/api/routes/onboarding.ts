import { Router } from "express";
import { submit } from "../controllers/onboarding.controller.js";

const router = Router();

router.post("/", submit);

export default router;
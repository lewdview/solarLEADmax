import { Router } from "express";
import * as leads from "../controllers/leads.controller.js";

const router = Router();

router.post("/intake", leads.intake);
router.get("/", leads.list);
router.get("/:id", leads.get);
router.patch("/:id", leads.update);

export default router;

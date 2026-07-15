import { Router } from "express";
import { protect } from "../middleware/protect";
import { createReport } from "../controllers/report.controller";

const router = Router();

router.post("/:bookId", protect, createReport);

export default router;
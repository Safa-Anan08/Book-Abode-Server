import { Router } from "express";

import { protect } from "../middleware/protect";

import { pdfUpload } from "../middleware/uploadPdf";
import { uploadPdf } from "../controllers/upload.controller";

const router = Router();

router.post(
  "/pdf",
  protect,
  pdfUpload.single("pdf"),
  uploadPdf
);

export default router;
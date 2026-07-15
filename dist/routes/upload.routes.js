"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const protect_1 = require("../middleware/protect");
const uploadPdf_1 = require("../middleware/uploadPdf");
const upload_controller_1 = require("../controllers/upload.controller");
const router = (0, express_1.Router)();
router.post("/pdf", protect_1.protect, uploadPdf_1.pdfUpload.single("pdf"), upload_controller_1.uploadPdf);
exports.default = router;

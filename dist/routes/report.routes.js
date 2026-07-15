"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const protect_1 = require("../middleware/protect");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
router.post("/:bookId", protect_1.protect, report_controller_1.createReport);
exports.default = router;

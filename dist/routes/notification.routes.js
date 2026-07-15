"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const protect_1 = require("../middleware/protect");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
router.get("/", protect_1.protect, notification_controller_1.getMyNotifications);
router.patch("/:id/read", protect_1.protect, notification_controller_1.markNotificationRead);
exports.default = router;

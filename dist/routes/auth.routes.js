"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const protect_1 = require("../middleware/protect");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = (0, express_1.Router)();
router.post("/google", auth_controller_1.googleLogin);
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.post("/logout", auth_controller_1.logout);
router.get("/me", protect_1.protect, auth_controller_1.getCurrentUser);
router.put("/profile", protect_1.protect, upload_1.default.single("image"), auth_controller_1.updateProfile);
exports.default = router;

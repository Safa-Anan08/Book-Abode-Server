"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = void 0;
const adminOnly = (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
            return;
        }
        if (req.user.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
            });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Admin Middleware Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.adminOnly = adminOnly;

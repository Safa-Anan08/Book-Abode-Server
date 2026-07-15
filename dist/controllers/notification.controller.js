"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getMyNotifications = void 0;
const db_1 = require("../config/db");
const mongodb_1 = require("mongodb");
const getMyNotifications = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const notifications = await db
            .collection("notifications")
            .find({
            userEmail: req.user.email,
        })
            .sort({
            createdAt: -1,
        })
            .toArray();
        res.json({
            success: true,
            notifications,
        });
    }
    catch {
        res.status(500).json({
            success: false,
        });
    }
};
exports.getMyNotifications = getMyNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        await db.collection("notifications").updateOne({
            _id: new mongodb_1.ObjectId(req.params.id),
            userEmail: req.user.email,
        }, {
            $set: {
                status: "read",
            },
        });
        res.json({
            success: true,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.markNotificationRead = markNotificationRead;

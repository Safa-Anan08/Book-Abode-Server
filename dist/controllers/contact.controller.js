"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const db_1 = require("../config/db");
const sendMessage = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Required fields missing"
            });
        }
        await db.collection("contacts").insertOne({
            name,
            email,
            subject,
            message,
            createdAt: new Date()
        });
        res.json({
            success: true,
            message: "Message sent successfully"
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
exports.sendMessage = sendMessage;

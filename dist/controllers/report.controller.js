"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReport = void 0;
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const createReport = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const { reason } = req.body;
        const bookId = req.params.bookId;
        if (!reason?.trim()) {
            res.status(400).json({
                success: false,
                message: "Reason is required.",
            });
            return;
        }
        if (!mongodb_1.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid book id.",
            });
            return;
        }
        const book = await db.collection("books").findOne({
            _id: new mongodb_1.ObjectId(bookId),
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found.",
            });
            return;
        }
        const exists = await db.collection("reports").findOne({
            bookId,
            reportedBy: req.user.email,
        });
        if (exists) {
            res.status(400).json({
                success: false,
                message: "You already reported this book.",
            });
            return;
        }
        await db.collection("reports").insertOne({
            bookId,
            bookTitle: book.title,
            ownerEmail: book.createdBy,
            reportedBy: req.user.email,
            reason,
            status: "pending",
            createdAt: new Date(),
        });
        await db.collection("notifications").insertOne({
            userEmail: book.createdBy,
            title: "Book Reported",
            message: `Your book "${book.title}" has been reported.`,
            bookId,
            bookTitle: book.title,
            reason,
            reportedBy: req.user.email,
            status: "unread",
            createdAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Report submitted successfully.",
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
exports.createReport = createReport;

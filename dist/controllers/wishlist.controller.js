"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWishlist = exports.removeWishlist = exports.getWishlist = exports.addWishlist = void 0;
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const addWishlist = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const bookId = req.params.bookId;
        if (!mongodb_1.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
            return;
        }
        const exists = await db
            .collection("wishlist")
            .findOne({
            userEmail: req.user.email,
            bookId,
        });
        if (exists) {
            res.status(400).json({
                success: false,
                message: "Already added to wishlist.",
            });
            return;
        }
        await db.collection("wishlist").insertOne({
            userEmail: req.user.email,
            bookId,
            createdAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Added to wishlist.",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.addWishlist = addWishlist;
const getWishlist = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const wishlist = await db
            .collection("wishlist")
            .find({
            userEmail: req.user.email,
        })
            .toArray();
        const ids = wishlist.map((item) => new mongodb_1.ObjectId(item.bookId));
        const books = await db
            .collection("books")
            .find({
            _id: { $in: ids },
        })
            .toArray();
        res.json({
            success: true,
            books,
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getWishlist = getWishlist;
const removeWishlist = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const bookId = req.params.bookId;
        await db.collection("wishlist").deleteOne({
            userEmail: req.user.email,
            bookId,
        });
        res.json({
            success: true,
            message: "Removed from wishlist.",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.removeWishlist = removeWishlist;
const checkWishlist = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const bookId = req.params.bookId;
        const item = await db
            .collection("wishlist")
            .findOne({
            userEmail: req.user.email,
            bookId,
        });
        res.json({
            success: true,
            wished: !!item,
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.checkWishlist = checkWishlist;

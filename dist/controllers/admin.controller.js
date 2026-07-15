"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContacts = exports.getRecentActivity = exports.deleteReport = exports.resolveReport = exports.getAllReports = exports.deleteUser = exports.updateUserRole = exports.sendBookReport = exports.deleteAnyBook = exports.getWishlistAnalytics = exports.getAllWishlists = exports.getAllBooks = exports.getAllUsers = exports.getDashboardStats = void 0;
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const getDashboardStats = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const [totalBooks, totalUsers, totalWishlists] = await Promise.all([
            db.collection("books").countDocuments(),
            db.collection("users").countDocuments(),
            db.collection("wishlists").countDocuments(),
        ]);
        const chart = await db
            .collection("books")
            .aggregate([
            {
                $group: {
                    _id: "$category",
                    value: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: 1,
                },
            },
        ])
            .toArray();
        res.status(200).json({
            success: true,
            stats: {
                totalBooks,
                totalUsers,
                totalWishlists,
            },
            chart,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to load dashboard.",
        });
    }
};
exports.getDashboardStats = getDashboardStats;
const getAllUsers = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const users = await db
            .collection("users")
            .find({})
            .project({ password: 0 })
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({
            success: true,
            users,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users.",
        });
    }
};
exports.getAllUsers = getAllUsers;
const getAllBooks = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const books = await db
            .collection("books")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({
            success: true,
            books,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch books.",
        });
    }
};
exports.getAllBooks = getAllBooks;
const getAllWishlists = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const wishlists = await db
            .collection("wishlist")
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({
            success: true,
            wishlists,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch wishlists.",
        });
    }
};
exports.getAllWishlists = getAllWishlists;
const getWishlistAnalytics = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const books = await db
            .collection("wishlist")
            .aggregate([
            {
                $group: {
                    _id: "$bookId",
                    wishlistCount: {
                        $sum: 1,
                    },
                    lastAdded: {
                        $max: "$createdAt",
                    },
                },
            },
            {
                $addFields: {
                    bookObjectId: {
                        $toObjectId: "$_id",
                    },
                },
            },
            {
                $lookup: {
                    from: "books",
                    localField: "bookObjectId",
                    foreignField: "_id",
                    as: "book",
                },
            },
            {
                $unwind: "$book",
            },
            {
                $project: {
                    _id: 0,
                    bookId: "$_id",
                    title: "$book.title",
                    author: "$book.author",
                    image: "$book.image",
                    category: "$book.category",
                    wishlistCount: 1,
                    lastAdded: 1,
                },
            },
            {
                $sort: {
                    wishlistCount: -1,
                },
            },
        ])
            .toArray();
        const totalWishlist = await db
            .collection("wishlist")
            .countDocuments();
        const totalUsers = await db
            .collection("wishlist")
            .distinct("userEmail");
        res.json({
            success: true,
            books,
            stats: {
                totalWishlist,
                totalUsers: totalUsers.length,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to load wishlist analytics.",
        });
    }
};
exports.getWishlistAnalytics = getWishlistAnalytics;
const deleteAnyBook = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const rawId = req.params.id;
        const id = Array.isArray(rawId)
            ? rawId[0]
            : rawId;
        if (!id || !mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID.",
            });
            return;
        }
        const objectId = new mongodb_1.ObjectId(id);
        const result = await db.collection("books").deleteOne({
            _id: objectId,
        });
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: "Book not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Book deleted successfully.",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to delete book.",
        });
    }
};
exports.deleteAnyBook = deleteAnyBook;
const sendBookReport = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const rawId = req.params.id;
        const id = Array.isArray(rawId)
            ? rawId[0]
            : rawId;
        const { reason } = req.body;
        if (!id || !mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID.",
            });
            return;
        }
        const objectId = new mongodb_1.ObjectId(id);
        const book = await db.collection("books").findOne({
            _id: objectId,
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found.",
            });
            return;
        }
        await db.collection("reports").insertOne({
            bookId: objectId,
            ownerEmail: book.createdBy,
            reason,
            reportedBy: req.user?.email,
            status: "pending",
            createdAt: new Date(),
        });
        await db
            .collection("notifications")
            .insertOne({
            userEmail: book.createdBy,
            title: "Book Reported",
            message: `Your book "${book.title}" has been reported by an administrator.`,
            bookId: id,
            bookTitle: book.title,
            reason,
            reportedBy: req.user.email,
            status: "unread",
            createdAt: new Date(),
        });
        res.status(200).json({
            success: true,
            message: "Report sent successfully.",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to send report.",
        });
    }
};
exports.sendBookReport = sendBookReport;
const updateUserRole = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = req.params.id;
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid user id.",
            });
            return;
        }
        const { role } = req.body;
        if (role !== "admin" &&
            role !== "user") {
            res.status(400).json({
                success: false,
                message: "Invalid role.",
            });
            return;
        }
        await db.collection("users").updateOne({
            _id: new mongodb_1.ObjectId(id),
        }, {
            $set: {
                role,
            },
        });
        res.json({
            success: true,
            message: "Role updated.",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.updateUserRole = updateUserRole;
const deleteUser = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = req.params.id;
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid user id.",
            });
            return;
        }
        await db.collection("users").deleteOne({
            _id: new mongodb_1.ObjectId(id),
        });
        res.json({
            success: true,
            message: "User deleted.",
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.deleteUser = deleteUser;
const getAllReports = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const reports = await db
            .collection("reports")
            .find({})
            .sort({
            createdAt: -1,
        })
            .toArray();
        res.json({
            success: true,
            reports,
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.getAllReports = getAllReports;
const resolveReport = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = req.params.id;
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
            });
            return;
        }
        await db
            .collection("reports")
            .updateOne({
            _id: new mongodb_1.ObjectId(id),
        }, {
            $set: {
                status: "resolved",
            },
        });
        res.json({
            success: true,
            message: "Resolved",
        });
    }
    catch {
        res.status(500).json({
            success: false,
        });
    }
};
exports.resolveReport = resolveReport;
const deleteReport = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = req.params.id;
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
            });
            return;
        }
        await db
            .collection("reports")
            .deleteOne({
            _id: new mongodb_1.ObjectId(id),
        });
        res.json({
            success: true,
            message: "Deleted",
        });
    }
    catch {
        res.status(500).json({
            success: false,
        });
    }
};
exports.deleteReport = deleteReport;
const getRecentActivity = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const [users, books, wishlists, reports, pendingReports,] = await Promise.all([
            db.collection("users")
                .find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .project({ password: 0 })
                .toArray(),
            db.collection("books")
                .find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray(),
            db.collection("wishlist")
                .find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray(),
            db.collection("reports")
                .find({})
                .sort({ createdAt: -1 })
                .limit(5)
                .toArray(),
            db.collection("reports").countDocuments({
                status: "pending",
            }),
        ]);
        res.json({
            success: true,
            pendingReports,
            users,
            books,
            wishlists,
            reports,
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
exports.getRecentActivity = getRecentActivity;
const getContacts = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const contacts = await db
            .collection("contacts")
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.status(200).json({
            success: true,
            contacts,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to load contacts",
        });
    }
};
exports.getContacts = getContacts;

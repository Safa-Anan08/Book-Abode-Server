"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBook = exports.canDownloadBook = exports.confirmPayment = exports.createCheckoutSession = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = require("../config/db");
const mongodb_1 = require("mongodb");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const createCheckoutSession = async (req, res) => {
    try {
        const { bookId } = req.body;
        if (!bookId || !mongodb_1.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid book id",
            });
            return;
        }
        const db = (0, db_1.getDB)();
        const book = await db
            .collection("books")
            .findOne({
            _id: new mongodb_1.ObjectId(bookId),
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found",
            });
            return;
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: [
                "card",
            ],
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/payment/success?book=${bookId}`,
            cancel_url: `${process.env.CLIENT_URL}/books/${bookId}`,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: "usd",
                        unit_amount: Math.round(book.price * 100),
                        product_data: {
                            name: book.title,
                            description: book.shortDescription,
                        },
                    },
                },
            ],
        });
        res.status(200).json({
            success: true,
            url: session.url,
        });
    }
    catch (error) {
        console.log("Checkout Error:", error);
        res.status(500).json({
            success: false,
            message: "Payment failed",
        });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const confirmPayment = async (req, res) => {
    try {
        const { bookId } = req.body;
        if (!bookId) {
            res.status(400).json({
                success: false,
                message: "Book id required",
            });
            return;
        }
        const db = (0, db_1.getDB)();
        const existing = await db
            .collection("purchases")
            .findOne({
            userEmail: req.user.email,
            bookId,
        });
        if (existing) {
            res.json({
                success: true,
                message: "Already purchased",
            });
            return;
        }
        await db
            .collection("purchases")
            .insertOne({
            userEmail: req.user.email,
            bookId,
            status: "paid",
            purchasedAt: new Date(),
        });
        res.json({
            success: true,
            message: "Purchase saved",
        });
    }
    catch (error) {
        console.log("Confirm Payment Error:", error);
        res.status(500).json({
            success: false,
        });
    }
};
exports.confirmPayment = confirmPayment;
const canDownloadBook = async (req, res) => {
    try {
        const bookId = req.params.bookId;
        if (!bookId) {
            res.status(400).json({
                success: false,
            });
            return;
        }
        const db = (0, db_1.getDB)();
        const purchase = await db
            .collection("purchases")
            .findOne({
            userEmail: req.user.email,
            bookId,
            status: "paid",
        });
        res.json({
            success: true,
            canDownload: !!purchase,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
        });
    }
};
exports.canDownloadBook = canDownloadBook;
const downloadBook = async (req, res) => {
    try {
        const bookId = req.params.bookId;
        if (!bookId ||
            !mongodb_1.ObjectId.isValid(bookId)) {
            res.status(400).json({
                success: false,
                message: "Invalid book id",
            });
            return;
        }
        const db = (0, db_1.getDB)();
        const purchase = await db
            .collection("purchases")
            .findOne({
            userEmail: req.user.email,
            bookId,
            status: "paid",
        });
        if (!purchase) {
            res.status(403).json({
                success: false,
                message: "Purchase required",
            });
            return;
        }
        const book = await db
            .collection("books")
            .findOne({
            _id: new mongodb_1.ObjectId(bookId),
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found",
            });
            return;
        }
        res.json({
            success: true,
            pdfUrl: book.pdfUrl,
        });
    }
    catch (error) {
        console.log("Download Error:", error);
        res.status(500).json({
            success: false,
        });
    }
};
exports.downloadBook = downloadBook;

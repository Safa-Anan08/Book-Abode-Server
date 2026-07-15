"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBook = exports.deleteBook = exports.getMyBooks = exports.getBookById = exports.getBooks = exports.createBook = void 0;
const db_1 = require("../config/db");
const mongodb_1 = require("mongodb");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const streamifier = require("streamifier");
const uploadToCloudinary = (file, folder, resourceType) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream({
            folder,
            resource_type: resourceType,
        }, (error, result) => {
            if (error)
                return reject(error);
            resolve(result);
        });
        streamifier
            .createReadStream(file.buffer)
            .pipe(stream);
    });
};
const createBook = async (req, res) => {
    try {
        const { title, author, category, price, rating, shortDescription, fullDescription, } = req.body;
        const files = req.files;
        const imageFile = files?.image?.[0];
        const pdfFile = files?.pdf?.[0];
        if (!imageFile) {
            res.status(400).json({
                success: false,
                message: "Book image is required.",
            });
            return;
        }
        if (!pdfFile) {
            res.status(400).json({
                success: false,
                message: "Book PDF is required.",
            });
            return;
        }
        if (!title?.trim() ||
            !author?.trim() ||
            !category?.trim() ||
            price === undefined ||
            !shortDescription?.trim() ||
            !fullDescription?.trim()) {
            res.status(400).json({
                success: false,
                message: "All required fields are required.",
            });
            return;
        }
        const uploadedImage = await uploadToCloudinary(imageFile, "bookabode/books", "image");
        const uploadedPdf = await uploadToCloudinary(pdfFile, "bookabode/pdfs", "raw");
        const db = (0, db_1.getDB)();
        const book = {
            title: title.trim(),
            author: author.trim(),
            category: category.trim(),
            image: uploadedImage.secure_url,
            imagePublicId: uploadedImage.public_id,
            pdfUrl: uploadedPdf.secure_url,
            pdfPublicId: uploadedPdf.public_id,
            price: Number(price),
            rating: rating ? Number(rating) : 0,
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
            createdBy: req.user.email,
            createdAt: new Date(),
        };
        const result = await db.collection("books").insertOne(book);
        res.status(201).json({
            success: true,
            message: "Book added successfully.",
            insertedId: result.insertedId,
        });
    }
    catch (error) {
        console.error("Create Book Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.createBook = createBook;
const getBooks = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const search = req.query.search || "";
        const category = req.query.category || "";
        const sortBy = req.query.sortBy || "newest";
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 8;
        const skip = (page - 1) * limit;
        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { author: { $regex: search, $options: "i" } },
            ];
        }
        if (category) {
            filter.category = category;
        }
        let sortOption = {};
        switch (sortBy) {
            case "priceLow":
                sortOption = { price: 1 };
                break;
            case "priceHigh":
                sortOption = { price: -1 };
                break;
            case "rating":
                sortOption = { rating: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }
        const books = await db
            .collection("books")
            .find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .toArray();
        const totalBooks = await db
            .collection("books")
            .countDocuments(filter);
        res.status(200).json({
            success: true,
            books,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalBooks / limit),
                totalBooks,
            },
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
exports.getBooks = getBooks;
const getBookById = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = String(req.params.id);
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID",
            });
            return;
        }
        const book = await db.collection("books").findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            book,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getBookById = getBookById;
const getMyBooks = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const books = await db
            .collection("books")
            .find({
            createdBy: req.user.email,
        })
            .sort({
            createdAt: -1,
        })
            .toArray();
        res.status(200).json({
            success: true,
            total: books.length,
            books,
        });
    }
    catch (error) {
        console.error("Get My Books Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.getMyBooks = getMyBooks;
const deleteBook = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const id = String(req.params.id);
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID.",
            });
            return;
        }
        const book = await db.collection("books").findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        if (!book) {
            res.status(404).json({
                success: false,
                message: "Book not found.",
            });
            return;
        }
        if (book.createdBy !== req.user.email) {
            res.status(403).json({
                success: false,
                message: "You are not authorized to delete this book.",
            });
            return;
        }
        await db.collection("books").deleteOne({
            _id: new mongodb_1.ObjectId(id),
        });
        res.status(200).json({
            success: true,
            message: "Book deleted successfully.",
        });
    }
    catch (error) {
        console.error("Delete Book Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.deleteBook = deleteBook;
const updateBook = async (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("ID:", req.params.id);
    try {
        const db = (0, db_1.getDB)();
        const id = String(req.params.id);
        if (!mongodb_1.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: "Invalid Book ID.",
            });
            return;
        }
        const existingBook = await db
            .collection("books")
            .findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        if (!existingBook) {
            res.status(404).json({
                success: false,
                message: "Book not found.",
            });
            return;
        }
        if (existingBook.createdBy !== req.user.email) {
            res.status(403).json({
                success: false,
                message: "You are not authorized.",
            });
            return;
        }
        const files = req.files;
        let imageUrl = existingBook.image;
        let imagePublicId = existingBook.imagePublicId;
        let pdfUrl = existingBook.pdfUrl;
        let pdfPublicId = existingBook.pdfPublicId;
        if (files?.image?.length) {
            const uploadedImage = await uploadToCloudinary(files.image[0], "bookabode/books", "image");
            imageUrl = uploadedImage.secure_url;
            imagePublicId = uploadedImage.public_id;
        }
        if (files?.pdf?.length) {
            const uploadedPdf = await uploadToCloudinary(files.pdf[0], "bookabode/pdfs", "raw");
            pdfUrl = uploadedPdf.secure_url;
            pdfPublicId = uploadedPdf.public_id;
        }
        const { title, author, category, price, rating, shortDescription, fullDescription, } = req.body;
        await db.collection("books").updateOne({
            _id: new mongodb_1.ObjectId(id),
        }, {
            $set: {
                title: title?.trim() ||
                    existingBook.title,
                author: author?.trim() ||
                    existingBook.author,
                category: category?.trim() ||
                    existingBook.category,
                image: imageUrl,
                imagePublicId,
                pdfUrl,
                pdfPublicId,
                price: price !== undefined
                    ? Number(price)
                    : existingBook.price,
                rating: rating !== undefined
                    ? Number(rating)
                    : existingBook.rating,
                shortDescription: shortDescription?.trim() ||
                    existingBook.shortDescription,
                fullDescription: fullDescription?.trim() ||
                    existingBook.fullDescription,
            },
        });
        res.status(200).json({
            success: true,
            message: "Book updated successfully.",
        });
    }
    catch (error) {
        console.error("Update Book Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.updateBook = updateBook;

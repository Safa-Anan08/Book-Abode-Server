"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const book_controller_1 = require("../controllers/book.controller");
const protect_1 = require("../middleware/protect");
const uploadPdf_1 = require("../middleware/uploadPdf");
const router = (0, express_1.Router)();
router.post("/", protect_1.protect, uploadPdf_1.pdfUpload.fields([
    {
        name: "image",
        maxCount: 1,
    },
    {
        name: "pdf",
        maxCount: 1,
    },
]), book_controller_1.createBook);
router.get("/", book_controller_1.getBooks);
router.get("/manage", protect_1.protect, book_controller_1.getMyBooks);
router.get("/:id", book_controller_1.getBookById);
router.put("/:id", protect_1.protect, uploadPdf_1.pdfUpload.fields([
    {
        name: "image",
        maxCount: 1,
    },
    {
        name: "pdf",
        maxCount: 1,
    },
]), book_controller_1.updateBook);
router.delete("/:id", protect_1.protect, book_controller_1.deleteBook);
exports.default = router;

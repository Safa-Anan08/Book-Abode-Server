"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPdf = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadPdf = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "No file uploaded.",
            });
            return;
        }
        const streamifier = require("streamifier");
        const stream = cloudinary_1.default.uploader.upload_stream({
            resource_type: "raw",
            folder: "bookabode/pdfs",
        }, (error, result) => {
            if (error || !result) {
                return res.status(500).json({
                    success: false,
                    message: "Upload failed.",
                });
            }
            return res.json({
                success: true,
                url: result.secure_url,
            });
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};
exports.uploadPdf = uploadPdf;

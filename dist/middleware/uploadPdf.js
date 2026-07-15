"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfUpload = void 0;
const multer_1 = __importDefault(require("multer"));
exports.pdfUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.fieldname === "image") {
            if (file.mimetype.startsWith("image/")) {
                return cb(null, true);
            }
            return cb(new Error("Only image files are allowed."));
        }
        if (file.fieldname === "pdf") {
            if (file.mimetype === "application/pdf") {
                return cb(null, true);
            }
            return cb(new Error("Only PDF files are allowed."));
        }
        cb(new Error("Invalid file field."));
    },
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
exports.default = exports.pdfUpload;

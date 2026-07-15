"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const db = (0, db_1.getDB)();
        const user = await db
            .collection("users")
            .findOne({
            _id: new mongodb_1.ObjectId(decoded.id),
        });
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        req.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
        next();
    }
    catch (error) {
        console.error(error);
        res.status(401).json({
            message: "Invalid Token",
        });
    }
};
exports.protect = protect;

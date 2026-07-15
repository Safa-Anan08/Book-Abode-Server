"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.me = exports.logout = exports.login = exports.register = void 0;
const mongodb_1 = require("mongodb");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const jwt_1 = require("../utils/jwt");
const register = async (req, res) => {
    try {
        const { name, email, password, photo } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
        const db = (0, db_1.getDB)();
        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const result = await db.collection("users").insertOne({
            name,
            email,
            password: hashedPassword,
            photo: photo || "",
            role: "user",
            createdAt: new Date(),
        });
        res.status(201).json({
            success: true,
            message: "Registration successful",
            userId: result.insertedId,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = (0, db_1.getDB)();
        const user = await db.collection("users").findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const matched = await bcrypt_1.default.compare(password, user.password);
        if (!matched) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        const token = (0, jwt_1.generateToken)(user._id.toString());
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            },
        });
    }
    catch {
        res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};
exports.login = login;
const logout = (_req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
    });
    res.json({
        success: true,
        message: "Logged out",
    });
};
exports.logout = logout;
const me = async (req, res) => {
    res.json(req.user);
};
exports.me = me;
const getCurrentUser = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const user = await db.collection("users").findOne({
            _id: new mongodb_1.ObjectId(req.user._id),
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                photo: user.photo || "",
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Get Current User Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};
exports.getCurrentUser = getCurrentUser;

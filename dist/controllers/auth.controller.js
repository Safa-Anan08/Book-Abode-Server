"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getCurrentUser = exports.me = exports.logout = exports.login = exports.register = exports.googleLogin = void 0;
const mongodb_1 = require("mongodb");
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const jwt_1 = require("../utils/jwt");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential missing"
            });
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(400).json({
                success: false,
                message: "Invalid Google token"
            });
        }
        const { email, name, picture } = payload;
        const db = (0, db_1.getDB)();
        const users = db.collection("users");
        let user = await users.findOne({
            email
        });
        if (!user) {
            const newUser = {
                name: name || "Google User",
                email,
                image: picture || "",
                role: "user",
                createdAt: new Date()
            };
            const result = await users.insertOne(newUser);
            user = {
                ...newUser,
                _id: result.insertedId
            };
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            role: user.role
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });
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
            message: "Google login successful",
            user
        });
    }
    catch (error) {
        console.error("GOOGLE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.googleLogin = googleLogin;
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
        const user = {
            name,
            email,
            password: hashedPassword,
            role: "user",
            image: photo ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C3955B&color=261311`,
            imagePublicId: "",
            createdAt: new Date(),
        };
        const result = await db.collection("users").insertOne(user);
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
                image: user.image || "",
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
const updateProfile = async (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const userId = req.user._id;
        const user = await db.collection("users").findOne({
            _id: new mongodb_1.ObjectId(userId),
        });
        if (!user) {
            return res.status(404).json({
                success: false,
            });
        }
        let image = user.image;
        let imagePublicId = user.imagePublicId;
        if (req.file) {
            if (imagePublicId) {
                await cloudinary_1.default.uploader.destroy(imagePublicId);
            }
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.default.uploader.upload_stream({
                    folder: "bookabode/users",
                }, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        resolve(result);
                });
                streamifier_1.default
                    .createReadStream(req.file.buffer)
                    .pipe(stream);
            });
            image = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;
        }
        await db.collection("users").updateOne({
            _id: new mongodb_1.ObjectId(userId),
        }, {
            $set: {
                name: req.body.name,
                image,
                imagePublicId,
            },
        });
        res.json({
            success: true,
            message: "Profile updated",
            image,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
        });
    }
};
exports.updateProfile = updateProfile;

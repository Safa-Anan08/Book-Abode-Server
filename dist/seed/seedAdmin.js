"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../config/db");
const seedAdmin = async () => {
    try {
        const db = (0, db_1.getDB)();
        const email = "admin@gmail.com";
        const existingAdmin = await db
            .collection("users")
            .findOne({ email });
        if (existingAdmin) {
            console.log("✅ Admin already exists.");
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash("admin@123", 10);
        await db.collection("users").insertOne({
            name: "Administrator",
            email,
            password: hashedPassword,
            role: "admin",
            photo: "",
            createdAt: new Date(),
        });
        console.log("🎉 Default admin created successfully.");
        console.log("Email: admin@gmail.com");
        console.log("Password: admin@123");
    }
    catch (error) {
        console.error("Seed Admin Error:", error);
    }
};
exports.seedAdmin = seedAdmin;

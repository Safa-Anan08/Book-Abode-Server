"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.getDB = getDB;
const mongodb_1 = require("mongodb");
const client = new mongodb_1.MongoClient(process.env.MONGODB_URI);
let db;
async function connectDB() {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    try {
        await client.connect();
        console.log(" MongoDB Connected");
    }
    catch (err) {
        console.error("MongoDB Error:", err);
    }
}
function getDB() {
    return db;
}

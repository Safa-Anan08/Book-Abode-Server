"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
dns_1.default.setServers(["8.8.8.8", "8.8.4.4"]);
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const seedAdmin_1 = require("./seed/seedAdmin");
const PORT = process.env.PORT || 5000;
async function startServer() {
    try {
        await (0, db_1.connectDB)();
        await (0, seedAdmin_1.seedAdmin)();
        app_1.default.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Server failed to start:", error);
        process.exit(1);
    }
}
startServer();

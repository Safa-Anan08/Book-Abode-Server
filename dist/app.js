"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const book_routes_1 = __importDefault(require("./routes/book.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api/auth", auth_routes_1.default);
app.use("/api/books", book_routes_1.default);
app.use("/api/wishlist", wishlist_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/reports", report_routes_1.default);
app.use("/api/notifications", notification_routes_1.default);
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use("/api/upload", upload_routes_1.default);
app.use("/api/payment", payment_routes_1.default);
app.get("/", (_, res) => {
    res.send("BookAbode API Running");
});
exports.default = app;

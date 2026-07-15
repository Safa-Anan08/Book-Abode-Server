import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import bookRoutes from "./routes/book.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import adminRoutes from "./routes/admin.routes";
import reportRoutes from "./routes/report.routes";
import notificationRoutes from "./routes/notification.routes";
import uploadRoutes from "./routes/upload.routes";
import paymentRoutes from "./routes/payment.routes";
import path from "path";
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.use("/api/wishlist", wishlistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);
app.use("/api/upload", uploadRoutes);

app.use("/api/payment", paymentRoutes);

app.get("/", (_, res) => {
  res.send("BookAbode API Running");
});

export default app;

import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { Notification } from "../types/notification";
type Params = {
  bookId: string;
};

export const createReport = async (
  req: Request<Params>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const { reason } = req.body;

    const bookId = req.params.bookId;

    if (!reason?.trim()) {
      res.status(400).json({
        success: false,
        message: "Reason is required.",
      });
      return;
    }

    if (!ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid book id.",
      });
      return;
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    const exists = await db.collection("reports").findOne({
      bookId,
      reportedBy: req.user!.email,
    });

    if (exists) {
      res.status(400).json({
        success: false,
        message: "You already reported this book.",
      });
      return;
    }

    await db.collection("reports").insertOne({
      bookId,
      bookTitle: book.title,
      ownerEmail: book.createdBy,
      reportedBy: req.user!.email,
      reason,
      status: "pending",
      createdAt: new Date(),
    });
await db.collection<Notification>("notifications").insertOne({
  userEmail: book.createdBy,
  title: "Book Reported",
  message: `Your book "${book.title}" has been reported.`,
  bookId,
  bookTitle: book.title,
  reason,
  reportedBy: req.user!.email,
  status: "unread",
  createdAt: new Date(),
});
    res.status(201).json({
      success: true,
      message: "Report submitted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
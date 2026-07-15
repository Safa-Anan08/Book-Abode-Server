import { ObjectId } from "mongodb";

export interface Notification {
  _id?: ObjectId;

  userEmail: string;

  title: string;

  message: string;

  bookId: string;

  bookTitle: string;

  reason: string;

  reportedBy: string;

  status: "unread" | "read";

  createdAt: Date;
}
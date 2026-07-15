import "express";
import { ObjectId } from "mongodb";

declare global {
  namespace Express {
    interface UserPayload {
      _id: ObjectId;
      name: string;
      email: string;
      role: "user" | "admin";
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
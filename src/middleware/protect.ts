import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { User } from "../types/user";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as {
      id: string;
    };

    const db = getDB();

    const user = await db
      .collection<User>("users")
      .findOne({
        _id: new ObjectId(decoded.id),
      });

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error(error);

    res.status(401).json({
      message: "Invalid Token",
    });
  }
};
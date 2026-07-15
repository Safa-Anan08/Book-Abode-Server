import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import { getDB } from "../config/db";
import { generateToken } from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, photo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const db = getDB();

    const existingUser = await db.collection("users").findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      photo: photo || "",
      role: "user",
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      userId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const db = getDB();

    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie("token", token, {
       httpOnly: true,
       secure: process.env.NODE_ENV === "production",
       sameSite:
           process.env.NODE_ENV === "production"
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
        photo: user.photo,
        role: user.role,
      },
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
});

  res.json({
    success: true,
    message: "Logged out",
  });
};

export const me = async (req: Request, res: Response) => {
  res.json(req.user);
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const user = await db.collection("users").findOne({
      _id: new ObjectId(req.user!._id),
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
        photo: user.photo || "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
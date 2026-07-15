import { Request, Response } from "express";
import { getDB } from "../config/db";
import { ObjectId } from "mongodb";
import { NotificationIdParams } from "../types/params";
export const getMyNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const notifications = await db
      .collection("notifications")
      .find({
        userEmail: req.user!.email,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.json({
      success: true,
      notifications,
    });
  } catch {
    res.status(500).json({
      success: false,
    });
  }
};

export const markNotificationRead = async (
  req: Request<NotificationIdParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    await db.collection("notifications").updateOne(
  {
    _id: new ObjectId(req.params.id),
    userEmail: req.user!.email,
  },
  {
    $set: {
      status: "read",
    },
  }
);

    res.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { Notification } from "../types/notification";
type IdParams = {
  id: string;
};
export const getDashboardStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const [totalBooks, totalUsers, totalWishlists] =
      await Promise.all([
        db.collection("books").countDocuments(),
        db.collection("users").countDocuments(),
        db.collection("wishlists").countDocuments(),
      ]);

    const chart = await db
      .collection("books")
      .aggregate([
        {
          $group: {
            _id: "$category",
            value: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            value: 1,
          },
        },
      ])
      .toArray();

    res.status(200).json({
      success: true,
      stats: {
        totalBooks,
        totalUsers,
        totalWishlists,
      },
      chart,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard.",
    });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const users = await db
      .collection("users")
      .find({})
      .project({ password: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

export const getAllBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const books = await db
      .collection("books")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      books,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books.",
    });
  }
};

export const getAllWishlists = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const wishlists = await db
      .collection("wishlist")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      wishlists,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlists.",
    });
  }
};
export const getWishlistAnalytics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const books = await db
      .collection("wishlist")
      .aggregate([
        
        {
          $group: {
            _id: "$bookId",
            wishlistCount: {
              $sum: 1,
            },
            lastAdded: {
              $max: "$createdAt",
            },
          },
        },

        {
          $addFields: {
            bookObjectId: {
              $toObjectId: "$_id",
            },
          },
        },

        {
          $lookup: {
            from: "books",
            localField: "bookObjectId",
            foreignField: "_id",
            as: "book",
          },
        },

        {
          $unwind: "$book",
        },

        {
          $project: {
            _id: 0,

            bookId: "$_id",

            title: "$book.title",

            author: "$book.author",

            image: "$book.image",

            category: "$book.category",

            wishlistCount: 1,

            lastAdded: 1,
          },
        },

        {
          $sort: {
            wishlistCount: -1,
          },
        },
      ])
      .toArray();

    const totalWishlist =
      await db
        .collection("wishlist")
        .countDocuments();

    const totalUsers =
      await db
        .collection("wishlist")
        .distinct("userEmail");

    res.json({
      success: true,

      books,

      stats: {
        totalWishlist,
        totalUsers: totalUsers.length,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to load wishlist analytics.",
    });
  }
};
export const deleteAnyBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const rawId = req.params.id;

    const id = Array.isArray(rawId)
      ? rawId[0]
      : rawId;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid Book ID.",
      });
      return;
    }

    const objectId = new ObjectId(id);

    const result = await db.collection("books").deleteOne({
      _id: objectId,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete book.",
    });
  }
};

export const sendBookReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const rawId = req.params.id;

    const id = Array.isArray(rawId)
      ? rawId[0]
      : rawId;

    const { reason } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid Book ID.",
      });
      return;
    }

    const objectId = new ObjectId(id);

    const book = await db.collection("books").findOne({
      _id: objectId,
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    await db.collection("reports").insertOne({
  bookId: objectId,
  ownerEmail: book.createdBy,
  reason,
  reportedBy: req.user?.email,
  status: "pending",
  createdAt: new Date(),
});
await db
  .collection<Notification>("notifications")
  .insertOne({
    userEmail: book.createdBy,
    title: "Book Reported",
    message: `Your book "${book.title}" has been reported by an administrator.`,
    bookId: id,
    bookTitle: book.title,
    reason,
    reportedBy: req.user!.email,
    status: "unread",
    createdAt: new Date(),
  });
    res.status(200).json({
      success: true,
      message: "Report sent successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send report.",
    });
  }
};

export const updateUserRole = async (
  req: Request<IdParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
      return;
    }

    const { role } = req.body;

    if (
      role !== "admin" &&
      role !== "user"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
      return;
    }

    await db.collection("users").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          role,
        },
      }
    );

    res.json({
      success: true,
      message: "Role updated.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const deleteUser = async (
  req: Request<IdParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
      return;
    }

    await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    });

    res.json({
      success: true,
      message: "User deleted.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllReports = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const reports = await db
      .collection("reports")
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.json({
      success: true,
      reports,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const resolveReport = async (
  req:  Request<IdParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
      });

      return;
    }

    await db
      .collection("reports")
      .updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            status: "resolved",
          },
        }
      );

    res.json({
      success: true,
      message: "Resolved",
    });
  } catch {
    res.status(500).json({
      success: false,
    });
  }
};

export const deleteReport = async (
  req:  Request<IdParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
      });

      return;
    }

    await db
      .collection("reports")
      .deleteOne({
        _id: new ObjectId(id),
      });

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch {
    res.status(500).json({
      success: false,
    });
  }
};

export const getRecentActivity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const [
      users,
      books,
      wishlists,
      reports,
      pendingReports,
    ] = await Promise.all([
      db.collection("users")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ password: 0 })
        .toArray(),

      db.collection("books")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),

      db.collection("wishlist")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),

      db.collection("reports")
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),

      db.collection("reports").countDocuments({
        status: "pending",
      }),
    ]);

    res.json({
      success: true,
      pendingReports,
      users,
      books,
      wishlists,
      reports,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db";
import { Wishlist } from "../types/wishlist";
import { Book } from "../types/book";

type WishlistParams = {
  bookId: string;
};
export const addWishlist = async (
  req: Request<WishlistParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const bookId = req.params.bookId;

    if (!ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        message: "Invalid Book ID",
      });
      return;
    }

    const exists = await db
      .collection<Wishlist>("wishlist")
      .findOne({
        userEmail: req.user!.email,
        bookId,
      });

    if (exists) {
      res.status(400).json({
        success: false,
        message: "Already added to wishlist.",
      });
      return;
    }

    await db.collection<Wishlist>("wishlist").insertOne({
      userEmail: req.user!.email,
      bookId,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Added to wishlist.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getWishlist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const wishlist = await db
      .collection<Wishlist>("wishlist")
      .find({
        userEmail: req.user!.email,
      })
      .toArray();

    const ids = wishlist.map(
      (item) => new ObjectId(item.bookId)
    );

    const books = await db
      .collection<Book>("books")
      .find({
        _id: { $in: ids },
      })
      .toArray();

    res.json({
      success: true,
      books,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const removeWishlist = async (
  req: Request<WishlistParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const bookId = req.params.bookId;

    await db.collection("wishlist").deleteOne({
      userEmail: req.user!.email,
      bookId,
    });

    res.json({
      success: true,
      message: "Removed from wishlist.",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const checkWishlist = async (
  req: Request<WishlistParams>,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const bookId = req.params.bookId;

    const item = await db
      .collection<Wishlist>("wishlist")
      .findOne({
        userEmail: req.user!.email,
        bookId,
      });

    res.json({
      success: true,
      wished: !!item,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
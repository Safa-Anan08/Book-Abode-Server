import { Request, Response } from "express";
import { getDB } from "../config/db";
import { Book } from "../types/book";
import { ObjectId } from "mongodb";
import cloudinary from "../config/cloudinary";
const streamifier = require("streamifier");

const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string,
  resourceType: "image" | "raw"
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);

        resolve(result);
      }
    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(stream);
  });
};



export const createBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      author,
      category,
      price,
      rating,
      shortDescription,
      fullDescription,

  
    } = req.body;
const files = req.files as {
  image?: Express.Multer.File[];
  pdf?: Express.Multer.File[];
};

const imageFile = files?.image?.[0];
const pdfFile = files?.pdf?.[0];
if (!imageFile) {
  res.status(400).json({
    success: false,
    message: "Book image is required.",
  });
  return;
}

if (!pdfFile) {
  res.status(400).json({
    success: false,
    message: "Book PDF is required.",
  });
  return;
}
    if (
      !title?.trim() ||
      !author?.trim() ||
      !category?.trim() ||
      price === undefined ||
      !shortDescription?.trim() ||
      !fullDescription?.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
      return;
    }
const uploadedImage =
  await uploadToCloudinary(
    imageFile,
    "bookabode/books",
    "image"
  );

const uploadedPdf =
  await uploadToCloudinary(
    pdfFile,
    "bookabode/pdfs",
    "raw"
  );
    const db = getDB();

    const book: Book = {
  title: title.trim(),
  author: author.trim(),
  category: category.trim(),

  image: uploadedImage.secure_url,
  imagePublicId:
    uploadedImage.public_id,

  pdfUrl:
    uploadedPdf.secure_url,
  pdfPublicId:
    uploadedPdf.public_id,

  price: Number(price),
  rating: rating ? Number(rating) : 0,

  shortDescription:
    shortDescription.trim(),

  fullDescription:
    fullDescription.trim(),

  createdBy: req.user!.email,

  createdAt: new Date(),
};

    const result = await db.collection<Book>("books").insertOne(book);

    res.status(201).json({
      success: true,
      message: "Book added successfully.",
      insertedId: result.insertedId,
    });
  } catch (error) {
    console.error("Create Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
export const getBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

   
    const search = (req.query.search as string) || "";
    const category = (req.query.category as string) || "";
    const sortBy = (req.query.sortBy as string) || "newest";

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;

    const skip = (page - 1) * limit;


    const filter: any = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    let sortOption = {};

    switch (sortBy) {
      case "priceLow":
        sortOption = { price: 1 };
        break;

      case "priceHigh":
        sortOption = { price: -1 };
        break;

      case "rating":
        sortOption = { rating: -1 };
        break;

      default:
        sortOption = { createdAt: -1 };
    }

    const books = await db
      .collection<Book>("books")
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalBooks = await db
      .collection<Book>("books")
      .countDocuments(filter);

    res.status(200).json({
      success: true,
      books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBooks / limit),
        totalBooks,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books.",
    });
  }
};
export const getBookById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = String(req.params.id);

if (!ObjectId.isValid(id)) {
  res.status(400).json({
    success: false,
    message: "Invalid Book ID",
  });
  return;
}

const book = await db.collection<Book>("books").findOne({
  _id: new ObjectId(id),
});

    
    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const getMyBooks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const books = await db
      .collection<Book>("books")
      .find({
        createdBy: req.user!.email,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.status(200).json({
      success: true,
      total: books.length,
      books,
    });
  } catch (error) {
    console.error("Get My Books Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
export const deleteBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid Book ID.",
      });
      return;
    }

    const book = await db.collection<Book>("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    if (book.createdBy !== req.user!.email) {
      res.status(403).json({
        success: false,
        message: "You are not authorized to delete this book.",
      });
      return;
    }

    await db.collection<Book>("books").deleteOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

export const updateBook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const db = getDB();

    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid Book ID.",
      });
      return;
    }

    const existingBook = await db
      .collection<Book>("books")
      .findOne({
        _id: new ObjectId(id),
      });

    if (!existingBook) {
      res.status(404).json({
        success: false,
        message: "Book not found.",
      });
      return;
    }

    if (existingBook.createdBy !== req.user!.email) {
      res.status(403).json({
        success: false,
        message: "You are not authorized.",
      });
      return;
    }

    const files = req.files as {
      image?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
    };

    let imageUrl = existingBook.image;
    let imagePublicId = existingBook.imagePublicId;

    let pdfUrl = existingBook.pdfUrl;
    let pdfPublicId = existingBook.pdfPublicId;

    if (files?.image?.length) {
      const uploadedImage = await uploadToCloudinary(
        files.image[0],
        "bookabode/books",
        "image"
      );

      imageUrl = uploadedImage.secure_url;
      imagePublicId = uploadedImage.public_id;
    }

    if (files?.pdf?.length) {
      const uploadedPdf = await uploadToCloudinary(
        files.pdf[0],
        "bookabode/pdfs",
        "raw"
      );

      pdfUrl = uploadedPdf.secure_url;
      pdfPublicId = uploadedPdf.public_id;
    }

    const {
      title,
      author,
      category,
      price,
      rating,
      shortDescription,
      fullDescription,
    } = req.body;

    await db.collection<Book>("books").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          title:
            title?.trim() ||
            existingBook.title,

          author:
            author?.trim() ||
            existingBook.author,

          category:
            category?.trim() ||
            existingBook.category,

          image: imageUrl,
          imagePublicId,

          pdfUrl,
          pdfPublicId,

          price:
            price !== undefined
              ? Number(price)
              : existingBook.price,

          rating:
            rating !== undefined
              ? Number(rating)
              : existingBook.rating,

          shortDescription:
            shortDescription?.trim() ||
            existingBook.shortDescription,

          fullDescription:
            fullDescription?.trim() ||
            existingBook.fullDescription,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Book updated successfully.",
    });
  } catch (error) {
    console.error("Update Book Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};
import { Router } from "express";
import {
  createBook,
  getBooks,
  getBookById,
  getMyBooks,
  deleteBook,
  updateBook,
} from "../controllers/book.controller";

import { protect } from "../middleware/protect";
import { pdfUpload } from "../middleware/uploadPdf";

const router = Router();

router.post(
  "/",
  protect,
  pdfUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  createBook
);

router.get("/", getBooks);

router.get("/manage", protect, getMyBooks);

router.get("/:id", getBookById);

router.put(
  "/:id",
  protect,
  pdfUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "pdf",
      maxCount: 1,
    },
  ]),
  updateBook
);
router.delete("/:id", protect, deleteBook);

export default router;
import { Router } from "express";
import { protect } from "../middleware/protect";

import {
  addWishlist,
  getWishlist,
  removeWishlist,
  checkWishlist,
} from "../controllers/wishlist.controller";

 const router = Router();


router.get("/", protect, getWishlist);


router.post("/:bookId", protect, addWishlist);


router.delete("/:bookId", protect, removeWishlist);


router.get("/check/:bookId", protect, checkWishlist);

export default router;
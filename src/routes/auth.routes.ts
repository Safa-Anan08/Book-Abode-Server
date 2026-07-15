import { Router } from "express";

import {
  register,
  login,
  logout,
  getCurrentUser,updateProfile,googleLogin
} from "../controllers/auth.controller";

import { protect } from "../middleware/protect";
import upload from "../middleware/upload";

const router = Router();
router.post(
 "/google",
 googleLogin
);

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout);


router.get("/me", protect, getCurrentUser);

router.put(
  "/profile",
  protect,
  upload.single("image"),
  updateProfile
);
export default router;
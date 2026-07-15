import { Router } from "express";

import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllBooks, 
  getWishlistAnalytics,
  deleteAnyBook,
  sendBookReport,
  getAllReports,
  resolveReport,
  deleteReport,
  getRecentActivity,getContacts
 
} from "../controllers/admin.controller";

import { protect } from "../middleware/protect";
import { adminOnly } from "../middleware/adminOnly";

const router = Router();

router.use(protect);
router.use(adminOnly);

router.get("/dashboard", getDashboardStats);

router.get("/users", getAllUsers);
router.patch(
  "/users/:id/role",
  updateUserRole
);

router.delete(
  "/users/:id",
  deleteUser
);

router.get("/books", getAllBooks);


router.get(
  "/wishlists",
  getWishlistAnalytics
);
router.delete("/books/:id", deleteAnyBook);

router.post("/books/:id/report", sendBookReport);

router.get("/reports", getAllReports);

router.patch(
  "/reports/:id/resolve",
  resolveReport
);

router.delete(
  "/reports/:id",
  deleteReport
);

router.get(
  "/activity",
  getRecentActivity
);
router.get("/contacts", getContacts);

export default router;
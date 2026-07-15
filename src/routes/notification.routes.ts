import { Router } from "express";

import { protect } from "../middleware/protect";

import {
  getMyNotifications,
  markNotificationRead,
} from "../controllers/notification.controller";

const router = Router();

router.get(
  "/",
  protect,
  getMyNotifications
);

router.patch(
  "/:id/read",
  protect,
  markNotificationRead
);

export default router;
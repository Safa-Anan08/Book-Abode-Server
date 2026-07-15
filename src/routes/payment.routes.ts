import { Router } from "express";
import { protect } from "../middleware/protect";

import {
  createCheckoutSession,
  confirmPayment,
  canDownloadBook,
  downloadBook,
} from "../controllers/payment.controller";

const router = Router();

router.post(
  "/checkout",
  protect,
  createCheckoutSession
);

router.post(
  "/confirm",
  protect,
  confirmPayment
);

router.get(
  "/download/:bookId",
  protect,
  downloadBook
);

router.get(
  "/can-download/:bookId",
  protect,
  canDownloadBook
);

export default router;
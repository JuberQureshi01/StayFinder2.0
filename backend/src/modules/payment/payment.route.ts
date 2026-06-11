import express from "express";
import {
  processPayment,
  verifyPayment,
  cancelPendingBooking,
} from "./payment.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { verifyPaymentSchema, cancelBookingBodySchema, initializePaymentSchema } from "../../config/validations";

const router = express.Router();

router.post("/process", authenticate, validateRequest(initializePaymentSchema, "body"), processPayment);
router.post("/verify", authenticate, validateRequest(verifyPaymentSchema, "body"), verifyPayment);
router.post("/cancel", authenticate, validateRequest(cancelBookingBodySchema, "body"), cancelPendingBooking);

export default router;

import { Router } from "express";
import {
  createBooking,
  getBookingById,
  getBookings,
  getHostBookings,
  cancelBooking,
  hostCancelBooking,
} from "./booking.controllers";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import {
  createBookingSchema,
  idParamSchema,
  cancelBookingSchema,
} from "../../config/validations";
import { getChatHistory } from "../chat/chat.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/create",
  validateRequest(createBookingSchema, "body"),
  createBooking,
);
router.patch("/:id/cancel", authenticate, validateRequest(idParamSchema, "params"), validateRequest(cancelBookingSchema, "body"), cancelBooking);
router.patch("/:id/host-cancel", authenticate, authorizeRoles("host", "admin"), validateRequest(idParamSchema, "params"), validateRequest(cancelBookingSchema, "body"), hostCancelBooking);
router.get("/", authenticate, getBookings);
router.get("/host", authenticate, getHostBookings);
router.get("/chat/:bookingId", authenticate, getChatHistory);
router.get("/:id", getBookingById);

export default router;

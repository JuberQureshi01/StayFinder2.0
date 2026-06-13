import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import Refund from "./refund.model";
import Booking from "../booking/booking.model";
import { calculateRefundAmount } from "../../services/refund-policy.service";

export const initiateRefund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookingId = req.params.bookingId;
  const userId = req.user._id;

  const booking = await Booking.findById(bookingId)
    .populate("listing", "title cancellationPolicy")
    .populate("user", "profile.name email");

  if (!booking) return res.status(404).json({ message: "Booking not found." });
  if (booking.user._id.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Unauthorized." });
  }
  if (booking.status === "completed") {
    return res.status(400).json({ message: "Cannot cancel a completed stay." });
  }
  if (booking.status === "cancelled") {
    return res.status(400).json({ message: "Booking is already cancelled." });
  }
  if (booking.status === "pending") {
    return res.status(400).json({ message: "Payment not completed." });
  }

  const existingRefund = await Refund.findOne({ booking: bookingId });
  if (existingRefund) return res.status(400).json({ message: "Refund already initiated." });
  if (!booking.razorpayPaymentId) return res.status(400).json({ message: "No payment record found." });

  const checkInDate = new Date(booking.checkIn);
  const now = new Date();
  const daysUntilCheckIn = Math.max(0, Math.floor((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const listing = booking.listing as any;
  const policy = listing?.cancellationPolicy || "moderate";

  if (daysUntilCheckIn < 1 && policy !== "flexible") {
    return res.status(400).json({ message: "Cannot cancel within 24 hours of check-in." });
  }

  const { refundAmount, deductionAmount } = calculateRefundAmount(daysUntilCheckIn, booking.totalPrice, policy);

  const refund = await Refund.create({
    booking: booking._id,
    user: userId,
    paymentId: booking.razorpayPaymentId,
    originalAmount: booking.totalPrice,
    refundAmount,
    deductionAmount,
    cancellationPolicy: policy,
    reason: req.body.reason || "User requested cancellation",
    status: "processing",
  });

  return res.status(200).json({ message: "Refund initiated.", refund });
});

export const getRefundStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const refund = await Refund.findOne({ booking: req.params.bookingId });
  if (!refund) return res.status(404).json({ message: "No refund found." });
  if (refund.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Unauthorized." });
  }
  return res.status(200).json({ refund });
});

export const getAllRefunds = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const refunds = await Refund.find()
    .populate("booking", "checkIn checkOut status")
    .populate("user", "profile.name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({ refunds });
});

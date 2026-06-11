import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import Refund from "./refund.model";
import Booking from "../booking/booking.model";

const calculateRefundAmount = (
  daysUntilCheckIn: number,
  totalAmount: number,
  policy: string,
): { refundAmount: number; deductionAmount: number } => {
  let refundPercent = 0;

  if (policy === "flexible") {
    if (daysUntilCheckIn >= 7) refundPercent = 100;
    else if (daysUntilCheckIn >= 3) refundPercent = 50;
    else refundPercent = 0;
  } else if (policy === "moderate") {
    if (daysUntilCheckIn >= 7) refundPercent = 100;
    else if (daysUntilCheckIn >= 1) refundPercent = 50;
    else refundPercent = 0;
  } else if (policy === "strict") {
    if (daysUntilCheckIn >= 7) refundPercent = 50;
    else if (daysUntilCheckIn >= 3) refundPercent = 25;
    else refundPercent = 0;
  } else {
    refundPercent = 0;
  }

  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const deductionAmount = totalAmount - refundAmount;

  return { refundAmount, deductionAmount };
};

export const initiateRefund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId)
      .populate("listing", "title cancellationPolicy")
      .populate("user", "profile.name email");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the booking owner can cancel." });
    }

    if (booking.status === "completed") {
      return res.status(400).json({ message: "Cannot cancel a completed stay." });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled." });
    }
    if (booking.status === "pending") {
      return res.status(400).json({ message: "Payment not completed. Use the pending cancel flow instead." });
    }

    const existingRefund = await Refund.findOne({ booking: bookingId });
    if (existingRefund) {
      return res.status(400).json({ message: "Refund already initiated for this booking." });
    }

    if (!booking.razorpayPaymentId) {
      return res.status(400).json({ message: "No payment record found for this booking." });
    }

    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    const timeDiff = checkInDate.getTime() - now.getTime();
    const daysUntilCheckIn = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));

    const listing = booking.listing as any;
    const policy = listing?.cancellationPolicy || "moderate";

    if (daysUntilCheckIn < 1 && policy !== "flexible") {
      return res.status(400).json({
        message: "Cannot cancel within 24 hours of check-in. Please contact support.",
      });
    }

    const { refundAmount, deductionAmount } = calculateRefundAmount(
      daysUntilCheckIn,
      booking.totalPrice,
      policy,
    );

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

    return res.status(200).json({
      message: "Refund initiated successfully.",
      refund: {
        _id: refund._id,
        originalAmount: refund.originalAmount,
        refundAmount: refund.refundAmount,
        deductionAmount: refund.deductionAmount,
        cancellationPolicy: refund.cancellationPolicy,
        status: refund.status,
      },
    });
  },
);

export const getRefundStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user._id;
    const userRole = req.user.role;

    const refund = await Refund.findOne({ booking: bookingId });
    if (!refund) {
      return res.status(404).json({ message: "No refund found for this booking." });
    }

    if (refund.user.toString() !== userId.toString() && userRole !== "admin") {
      return res.status(403).json({ message: "Unauthorized." });
    }

    return res.status(200).json({ refund });
  },
);

export const getAllRefunds = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const refunds = await Refund.find()
      .populate("booking", "checkIn checkOut status")
      .populate("user", "profile.name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ refunds });
  },
);

import { Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import Booking from "../booking/booking.model";

let _razorpay: Razorpay | null = null;
const getRazorpay = (): Razorpay => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
  return _razorpay;
};

// @desc    Process payment and generate Razorpay Order
// @route   POST /api/payments/process
export const processPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    // Create the Razorpay Order
    const options = {
      amount: Math.round(booking.totalPrice * 100), // Razorpay strictly requires paise (₹1 = 100 paise)
      currency: "INR",
      receipt: `receipt_${booking._id}`,
    };

    const order = await getRazorpay().orders.create(options);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  },
);

// @desc    Verify payment signature and confirm booking
// @route   POST /api/payments/verify
export const verifyPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    // Verify the crypto signature to prevent hacking
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
      }
      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to verify this payment." });
      }
      booking.status = "confirmed";
      booking.razorpayPaymentId = razorpay_payment_id;
      await booking.save();

      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid payment signature" });
    }
  },
);

// @desc    Cancel/Release a pending booking (Frees up the calendar)
// @route   POST /api/payments/cancel
export const cancelPendingBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this booking." });
    }
    if (booking.status === "pending") {
      await booking.deleteOne();
      return res.status(200).json({ message: "Pending reservation released." });
    }
    return res.status(400).json({ message: "Only pending bookings can be cancelled here." });
  },
);

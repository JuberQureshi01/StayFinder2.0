import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import { PaymentService } from "../../services/payment.service";
import Booking from "../booking/booking.model";

export const processPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Booking not found." });

  const order = await PaymentService.createOrder(booking.totalPrice, `receipt_${booking._id}`);

  return res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

export const verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  const isValid = PaymentService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Booking not found." });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized." });
  }

  booking.status = "confirmed";
  booking.razorpayPaymentId = razorpay_payment_id;
  booking.razorpayOrderId = razorpay_order_id;
  await booking.save();

  return res.status(200).json({ message: "Payment verified successfully" });
});

export const cancelPendingBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return res.status(404).json({ message: "Booking not found." });
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized." });
  }
  if (booking.status === "pending") {
    await booking.deleteOne();
    return res.status(200).json({ message: "Pending reservation cancelled." });
  }
  return res.status(400).json({ message: "Only pending bookings can be cancelled here." });
});

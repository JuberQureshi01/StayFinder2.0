import Booking from "./booking.model";
import Listing from "../listing/listing.model";
import Refund from "../refund/refund.model";
import { PaymentService } from "../../services/payment.service";
import { NotificationService } from "../../services/notification.service";
import { EmailService } from "../../services/email.service";
import { calculateRefundAmount } from "../../services/refund-policy.service";

export const checkAvailability = async (
  listingId: string,
  reqCheckIn: Date,
  reqCheckOut: Date
): Promise<boolean> => {
  const bookingOfHotel = await Booking.find({
    listing: listingId,
    checkIn: { $lt: reqCheckOut },
    checkOut: { $gt: reqCheckIn },
    status: { $ne: "cancelled" },
  });

  return bookingOfHotel.length === 0;
};

export const createBookingService = async (
  listingId: string,
  userId: string,
  checkIn: string,
  checkOut: string,
) => {
  const parsedCheckIn = new Date(checkIn);
  const parsedCheckOut = new Date(checkOut);

  parsedCheckIn.setHours(0, 0, 0, 0);
  parsedCheckOut.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedCheckIn < today) {
    throw { statusCode: 400, message: "Check-in date cannot be in the past." };
  }

  if (parsedCheckOut <= parsedCheckIn) {
    throw { statusCode: 400, message: "Check-out date must be strictly after the check-in date." };
  }

  const listing = await Listing.findById(listingId);
  if (!listing) throw { statusCode: 404, message: "Listing not found." };

  if (listing.host.toString() === userId) {
    throw { statusCode: 403, message: "Hosts cannot book their own listings." };
  }

  const overlappingBookings = await Booking.find({
    listing: listingId,
    status: { $in: ["pending", "confirmed", "completed"] },
    $or: [{ checkIn: { $lt: parsedCheckOut }, checkOut: { $gt: parsedCheckIn } }],
  });

  if (overlappingBookings.length > 0) {
    throw { statusCode: 400, message: "The requested dates are not available." };
  }

  const timeDifference = parsedCheckOut.getTime() - parsedCheckIn.getTime();
  const totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
  const totalPrice = listing.price * totalDays;

  const newBooking = new Booking({
    user: userId,
    listing: listingId,
    host: listing.host,
    checkIn: parsedCheckIn,
    checkOut: parsedCheckOut,
    totalPrice,
    status: "pending",
  });

  await newBooking.save();
  return newBooking;
};

const clearBlockedDates = async (listingId: string, checkIn: Date, checkOut: Date) => {
  const listingDoc = await Listing.findById(listingId);
  if (listingDoc && listingDoc.blockedDates) {
    listingDoc.blockedDates = listingDoc.blockedDates.filter(
      (d) => d < checkIn || d >= checkOut
    );
    await listingDoc.save();
  }
};

const createRefundRecord = async (data: any) => {
  return Refund.create(data);
};

export const hostCancelBookingService = async (
  bookingId: string,
  userId: string,
  reason: string,
) => {
  const booking = await Booking.findById(bookingId)
    .populate("listing", "title cancellationPolicy host")
    .populate("user", "profile.name email");

  if (!booking) throw { statusCode: 404, message: "Booking not found." };

  const listing = booking.listing as any;
  const bookingHostId = listing?.host?._id || listing?.host;

  if (!bookingHostId || bookingHostId.toString() !== userId) {
    throw { statusCode: 403, message: "Only the host of this listing can cancel." };
  }

  if (booking.status === "completed") {
    throw { statusCode: 400, message: "Cannot cancel a completed stay." };
  }

  if (booking.status === "cancelled") {
    throw { statusCode: 400, message: "Booking is already cancelled." };
  }

  booking.status = "cancelled";
  booking.cancellationReason = reason || "Cancelled by host";
  await booking.save();

  await clearBlockedDates(listing._id.toString(), new Date(booking.checkIn), new Date(booking.checkOut));

  let razorpayRefundId: string | null = null;
  const paymentId = booking.razorpayPaymentId;

  if (paymentId && booking.totalPrice > 0) {
    const result = await PaymentService.initiateRefund(paymentId, booking.totalPrice);
    if (result) razorpayRefundId = result.id;
    booking.refunded = true;
    await booking.save();

    await createRefundRecord({
      booking: booking._id,
      user: (booking.user as any)._id || booking.user,
      paymentId,
      originalAmount: booking.totalPrice,
      refundAmount: booking.totalPrice,
      deductionAmount: 0,
      cancellationPolicy: "full_refund",
      reason: reason || "Cancelled by host",
      status: "processing",
      razorpayRefundId: razorpayRefundId || undefined,
      processedAt: undefined,
    });
  }

  const guestName = (booking.user as any)?.profile?.name || "Guest";
  const guestEmail = (booking.user as any)?.email;
  const listingTitle = listing?.title || "your stay";

  await NotificationService.send({
    userId: ((booking.user as any)._id || booking.user).toString(),
    type: "booking_cancelled",
    title: "Booking Cancelled by Host",
    message: `Your booking at ${listingTitle} has been cancelled by the host. Full refund will be processed.`,
    link: "/trips",
  });

  if (guestEmail) {
    EmailService.sendRefundEmail(guestEmail, guestName, {
      bookingId: booking._id.toString(),
      refundAmount: booking.totalPrice,
      refundId: razorpayRefundId || "N/A",
    }).catch((err) => console.error("Refund email failed:", err));
  }

  return booking;
};

export const cancelBookingService = async (
  bookingId: string,
  userId: string,
  reason: string,
) => {
  const booking = await Booking.findById(bookingId)
    .populate("listing", "title cancellationPolicy host")
    .populate("user", "profile.name email");

  if (!booking) throw { statusCode: 404, message: "Booking not found." };
  if (booking.user._id.toString() !== userId) {
    throw { statusCode: 403, message: "Only the booking owner can cancel." };
  }

  if (booking.status === "completed") {
    throw { statusCode: 400, message: "Cannot cancel a completed stay." };
  }

  if (booking.status === "cancelled") {
    throw { statusCode: 400, message: "Booking is already cancelled." };
  }

  if (booking.status === "pending") {
    booking.status = "cancelled";
    booking.cancellationReason = reason;
    await booking.save();
    await clearBlockedDates((booking.listing as any)._id.toString(), new Date(booking.checkIn), new Date(booking.checkOut));
    return { message: "Pending booking cancelled. No payment was made.", booking };
  }

  if (booking.refunded) {
    throw { statusCode: 400, message: "Refund already processed for this booking." };
  }

  const listing = booking.listing as any;
  const policy = listing?.cancellationPolicy || "moderate";

  const checkInDate = new Date(booking.checkIn);
  const now = new Date();
  const daysUntilCheckIn = Math.max(0, Math.floor((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (daysUntilCheckIn < 1 && policy !== "flexible") {
    throw { statusCode: 400, message: "Cannot cancel within 24 hours of check-in. Please contact support." };
  }

  const { refundAmount, deductionAmount } = calculateRefundAmount(daysUntilCheckIn, booking.totalPrice, policy);
  const paymentId = booking.razorpayPaymentId;

  if (!paymentId) throw { statusCode: 400, message: "No payment record found for this booking." };

  let razorpayRefundId: string | null = null;

  if (refundAmount > 0) {
    const result = await PaymentService.initiateRefund(paymentId, refundAmount);
    if (!result) throw { statusCode: 502, message: "Refund failed at payment gateway. Please contact support." };
    razorpayRefundId = result.id;
  }

  booking.status = "cancelled";
  booking.cancellationReason = reason || "User requested cancellation";
  booking.refunded = refundAmount > 0;
  await booking.save();

  await clearBlockedDates((booking.listing as any)._id.toString(), new Date(booking.checkIn), new Date(booking.checkOut));

  const refund = await createRefundRecord({
    booking: booking._id,
    user: userId,
    paymentId,
    originalAmount: booking.totalPrice,
    refundAmount,
    deductionAmount,
    cancellationPolicy: policy,
    reason: reason || "User requested cancellation",
    status: refundAmount > 0 ? "processing" : "completed",
    razorpayRefundId: razorpayRefundId || undefined,
    processedAt: refundAmount > 0 ? undefined : new Date(),
  });

  const userName = (booking.user as any)?.profile?.name || "Guest";
  const userEmail = (booking.user as any)?.email;

  if (refundAmount > 0) {
    await NotificationService.send({
      userId: userId.toString(),
      type: "booking_cancelled",
      title: "Refund Initiated",
      message: `₹${refundAmount.toLocaleString("en-IN")} will be credited within 5-7 business days.`,
      link: "/trips",
    });

    if (userEmail) {
      EmailService.sendRefundEmail(userEmail, userName, {
        bookingId: booking._id.toString(),
        refundAmount,
        refundId: razorpayRefundId || "N/A",
      }).catch((err) => console.error("Refund email failed:", err));
    }
  }

  const hostId = listing?.host?.toString();
  if (hostId) {
    await NotificationService.send({
      userId: hostId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `A booking at ${listing?.title || "your listing"} has been cancelled.`,
      link: "/host/dashboard",
    });
  }

  return {
    message: refundAmount > 0
      ? `Booking cancelled. ₹${refundAmount.toLocaleString("en-IN")} refund initiated.`
      : "Booking cancelled. No refund applicable.",
    refund,
  };
};

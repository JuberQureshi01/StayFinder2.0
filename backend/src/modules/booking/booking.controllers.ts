import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import Booking from "./booking.model";
import Listing from "../listing/listing.model";
import Refund from "../refund/refund.model";
import { PaymentService } from "../../services/payment.service";
import { NotificationService } from "../../services/notification.service";
import { EmailService } from "../../services/email.service";

// @desc    Get all bookings (Polymorphic: Trips for Users, Reservations for Hosts)
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    let query = {};

    // Fetch from database and populate the related Listing and Guest data
    const bookings = await Booking.find({ user: user._id })
      .populate("listing", "title images locationName price")
      .populate("user", "profile.name email") // Populates the guest's info for the host
      .sort({ createdAt: -1 }); // Newest bookings first

    return res.status(200).json({
      message: "Bookings retrieved successfully",
      count: bookings.length,
      bookings,
    });
  },
);

export const createBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { listingId, checkIn, checkOut } = req.body;
    const user = req.user;

    // 1. FORCE DATE OBJECT CONVERSION
    // We must convert the frontend ISO strings into strict Date objects for MongoDB
    const parsedCheckIn = new Date(checkIn);
    const parsedCheckOut = new Date(checkOut);

    // Normalize to start of day to prevent time-zone overlap bugs
    parsedCheckIn.setHours(0, 0, 0, 0);
    parsedCheckOut.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. BASIC VALIDATION
    if (parsedCheckIn < today) {
      return res
        .status(400)
        .json({ message: "Check-in date cannot be in the past." });
    }
    if (parsedCheckOut <= parsedCheckIn) {
      return res.status(400).json({
        message: "Check-out date must be strictly after the check-in date.",
      });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    // Prevent hosts from booking their own properties
    if (listing.host.toString() === user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Hosts cannot book their own listings." });
    }

    // 3. THE CRITICAL OVERLAP QUERY
    const overlappingBookings = await Booking.find({
      listing: listingId,
      // ONLY check active bookings. Ignore cancelled or failed ones!
      status: { $in: ["pending", "confirmed", "completed"] },
      // The strict mathematical formula for date overlaps
      $or: [
        {
          checkIn: { $lt: parsedCheckOut },
          checkOut: { $gt: parsedCheckIn },
        },
      ],
    });

    // console.log(overlappingBookings);

    if (overlappingBookings.length > 0) {
      return res.status(400).json({
        message:
          "The requested property listing scheduling is unavailable during your chosen parameters.",
      });
    }

    // 4. CALCULATE PRICING
    const timeDifference = parsedCheckOut.getTime() - parsedCheckIn.getTime();
    const totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

    const totalPrice = listing.price * totalDays;

    // 5. CREATE PENDING BOOKING
    const newBooking = new Booking({
      user: user._id,
      listing: listingId,
      host: listing.host,
      checkIn: parsedCheckIn,
      checkOut: parsedCheckOut,
      totalPrice,
      status: "pending", // Remains pending until Razorpay confirms payment
    });

    await newBooking.save();

    return res.status(201).json({
      message: "Booking initialized successfully.",
      booking: newBooking,
    });
  },
);

export const getAllBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Polymorphic Query: Automatically filter records based on user context role parameters
    const filterCriteria =
      userRole === "host" ? { host: userId } : { user: userId };

    const bookingHistory = await Booking.find(filterCriteria)
      .populate("listing", "title images price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Booking history profile logs retrieved successfully.",
      count: bookingHistory.length,
      bookings: bookingHistory,
    });
  },
);

// @desc    Get bookings for host's listings (reservations from guests)
// @route   GET /api/bookings/host
// @access  Private (host only)
export const getHostBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const hostId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as string;

    const filter: Record<string, any> = { host: hostId };
    if (status && ["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("user", "profile.name email profile.image")
        .populate("listing", "title images locationName price")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  },
);

export const getBookingById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user._id;

    const currentBooking = await Booking.findById(id)
      .populate("listing", "title images location host")
      .populate("user", "profile.name email");

    if (!currentBooking) {
      return res.status(404).json({
        message:
          "Specified booking item record reference trace does not exist.",
      });
    }

    // FIX: Access IDs safely.
    // currentBooking.user might be an object (populated) or an ID (if not populated).
    // We handle both cases to be safe.
    const bookingUserId = currentBooking.user?._id || currentBooking.user;
    const bookingHostId = currentBooking.host; // Host is usually just an ID in your schema

    // Security Interceptor Boundary Guard
    if (
      bookingUserId.toString() !== userId.toString() &&
      bookingHostId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        message:
          "Access Forbidden. Unauthorized asset transaction parsing requested.",
      });
    }

    return res.status(200).json({
      message: "Detailed transaction metrics compiled successfully.",
      booking: currentBooking,
    });
  },
);

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
  }
  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  return { refundAmount, deductionAmount: totalAmount - refundAmount };
};

// @desc    Host cancels a booking on their listing (full refund to guest)
// @route   PATCH /api/bookings/:id/host-cancel
// @access  Private (host only)
export const hostCancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const userId = req.user._id;

  const booking = await Booking.findById(id)
    .populate("listing", "title cancellationPolicy host")
    .populate("user", "profile.name email");
  if (!booking) return res.status(404).json({ message: "Booking not found." });

  const listing = booking.listing as any;
  const bookingHostId = listing?.host?._id || listing?.host;

  if (!bookingHostId || bookingHostId.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Only the host of this listing can cancel." });
  }

  if (booking.status === "completed") {
    return res.status(400).json({ message: "Cannot cancel a completed stay." });
  }
  if (booking.status === "cancelled") {
    return res.status(400).json({ message: "Booking is already cancelled." });
  }

  booking.status = "cancelled";
  booking.cancellationReason = reason || "Cancelled by host";
  await booking.save();

  const listingDoc = await Listing.findById(listing._id);
  if (listingDoc && listingDoc.blockedDates) {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    listingDoc.blockedDates = listingDoc.blockedDates.filter((d) => d < checkIn || d >= checkOut);
    await listingDoc.save();
  }

  // Full refund to guest for host-initiated cancellation
  const paymentId = booking.razorpayPaymentId;
  let razorpayRefundId: string | null = null;
  if (paymentId && booking.totalPrice > 0) {
    const result = await PaymentService.initiateRefund(paymentId, booking.totalPrice);
    if (result) {
      razorpayRefundId = result.id;
    }
    booking.refunded = true;
    await booking.save();

    await Refund.create({
      booking: booking._id,
      user: booking.user._id || booking.user,
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

  // Notify guest
  const guestName = (booking.user as any)?.profile?.name || "Guest";
  const guestEmail = (booking.user as any)?.email;
  const listingTitle = listing?.title || "your stay";

  await NotificationService.send({
    userId: (booking.user._id || booking.user).toString(),
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

  return res.status(200).json({
    message: "Booking cancelled. Full refund has been initiated to the guest.",
    booking,
  });
});

export const cancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body;
  const userId = req.user._id;

  const booking = await Booking.findById(id)
    .populate("listing", "title cancellationPolicy host")
    .populate("user", "profile.name email");
  if (!booking) return res.status(404).json({ message: "Booking not found." });

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
    booking.status = "cancelled";
    booking.cancellationReason = reason;
    await booking.save();
    const listing = await Listing.findById(booking.listing._id);
    if (listing && listing.blockedDates) {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      listing.blockedDates = listing.blockedDates.filter((d) => d < checkIn || d >= checkOut);
      await listing.save();
    }
    return res.status(200).json({ message: "Pending booking cancelled. No payment was made." });
  }

  if (booking.refunded) {
    return res.status(400).json({ message: "Refund already processed for this booking." });
  }

  const listing = booking.listing as any;
  const policy = listing?.cancellationPolicy || "moderate";

  const checkInDate = new Date(booking.checkIn);
  const now = new Date();
  const daysUntilCheckIn = Math.max(0, Math.floor((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

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

  const paymentId = booking.razorpayPaymentId;
  if (!paymentId) {
    return res.status(400).json({ message: "No payment record found for this booking." });
  }

  let razorpayRefundId: string | null = null;
  if (refundAmount > 0) {
    const result = await PaymentService.initiateRefund(paymentId, refundAmount);
    if (!result) {
      return res.status(502).json({ message: "Refund failed at payment gateway. Please contact support." });
    }
    razorpayRefundId = result.id;
  }

  booking.status = "cancelled";
  booking.cancellationReason = reason || "User requested cancellation";
  booking.refunded = refundAmount > 0;
  await booking.save();

  const listingDoc = await Listing.findById(booking.listing._id);
  if (listingDoc && listingDoc.blockedDates) {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    listingDoc.blockedDates = listingDoc.blockedDates.filter((d) => d < checkIn || d >= checkOut);
    await listingDoc.save();
  }

  const refund = await Refund.create({
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

  return res.status(200).json({
    message: refundAmount > 0
      ? `Booking cancelled. ₹${refundAmount.toLocaleString("en-IN")} refund initiated (5-7 business days).`
      : "Booking cancelled. No refund applicable per cancellation policy.",
    refund: {
      _id: refund._id,
      originalAmount: refund.originalAmount,
      refundAmount: refund.refundAmount,
      deductionAmount: refund.deductionAmount,
      cancellationPolicy: refund.cancellationPolicy,
      status: refund.status,
    },
  });
});
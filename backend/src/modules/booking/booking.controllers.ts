import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import Booking from "./booking.model";
import {
  createBookingService,
  hostCancelBookingService,
  cancelBookingService,
} from "./booking.service";

export const getBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("listing", "title images locationName price")
    .populate("user", "profile.name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({ message: "Bookings retrieved.", count: bookings.length, bookings });
});

export const createBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { listingId, checkIn, checkOut } = req.body;
  const booking = await createBookingService(listingId, req.user._id, checkIn, checkOut);
  return res.status(201).json({ message: "Booking created.", booking });
});

export const getAllBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const filterCriteria = userRole === "host" ? { host: userId } : { user: userId };

  const bookings = await Booking.find(filterCriteria)
    .populate("listing", "title images price")
    .sort({ createdAt: -1 });

  return res.status(200).json({ message: "Bookings retrieved.", count: bookings.length, bookings });
});

export const getHostBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  res.status(200).json({ bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getBookingById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await Booking.findById(req.params.id)
    .populate("listing", "title images location host")
    .populate("user", "profile.name email");

  if (!booking) return res.status(404).json({ message: "Booking not found." });

  const bookingUserId = (booking.user as any)?._id || booking.user;
  const bookingHostId = booking.host;

  if (
    bookingUserId.toString() !== req.user._id.toString() &&
    bookingHostId.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: "Access denied." });
  }

  return res.status(200).json({ message: "Booking retrieved.", booking });
});

export const hostCancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const booking = await hostCancelBookingService(req.params.id as string, req.user._id.toString(), req.body.reason);
  return res.status(200).json({ message: "Booking cancelled. Full refund initiated.", booking });
});

export const cancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await cancelBookingService(req.params.id as string, req.user._id.toString(), req.body.reason);
  return res.status(200).json(result);
});

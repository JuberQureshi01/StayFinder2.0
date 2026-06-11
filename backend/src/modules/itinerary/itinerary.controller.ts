import { Response } from "express";
import mongoose from "mongoose";
import Itinerary from "./itinerary.model";
import Booking from "../booking/booking.model";
import Listing from "../listing/listing.model";
import { AIService } from "../../services/ai.service";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

const MAX_BOOKED_VERSIONS = 3;
const MAX_PUBLIC_PER_LISTING = 1;

export const generateListingItinerary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const listingId = req.params.listingId as string;
    const { people, groupType, style, budget, days } = req.body;
    const userId = req.user._id;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    const hasBooking = await Booking.findOne({
      user: userId,
      listing: listingId,
      status: { $in: ["confirmed", "completed"] },
    });
    if (hasBooking) {
      return res.status(400).json({ message: "You have a booking for this property. Use the itinerary feature from your Trips page." });
    }

    const existingCount = await Itinerary.countDocuments({
      user: userId,
      listing: listingId,
      booking: { $exists: false },
    });
    if (existingCount >= MAX_PUBLIC_PER_LISTING) {
      const existing = await Itinerary.findOne({ user: userId, listing: listingId, booking: { $exists: false } });
      return res.status(200).json({ message: "Showing your saved itinerary.", itinerary: existing, limitReached: true });
    }

    const location = listing.locationName || "the local area";
    const propertyName = listing.title || "Unknown Property";
    const totalDays = days || 3;

    const content = await AIService.generateItinerary(
      location,
      totalDays,
      propertyName,
      people || 2,
      groupType || "couple",
      style || "relaxed",
      budget || "moderate",
    );

    const itinerary = await Itinerary.create({
      user: userId,
      listing: listingId,
      location,
      totalDays,
      preferences: { people: people || 2, groupType: groupType || "couple", style: style || "relaxed", budget: budget || "moderate" },
      content,
    });

    return res.status(201).json({ message: "Itinerary generated.", itinerary });
  },
);

export const getListingItinerary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const listingId = req.params.listingId as string;
    const userId = req.user._id;

    const itinerary = await Itinerary.findOne({ user: userId, listing: listingId, booking: { $exists: false } });
    if (!itinerary) return res.status(404).json({ message: "No itinerary for this listing." });

    return res.status(200).json({ itinerary });
  },
);

export const generateItinerary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const { people, groupType, style, budget, days } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate("listing");
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not your booking." });
    }

    const existing = await Itinerary.findOne({ booking: new mongoose.Types.ObjectId(bookingId) });
    if (existing && existing.version >= MAX_BOOKED_VERSIONS) {
      return res.status(400).json({ message: `Maximum ${MAX_BOOKED_VERSIONS} itineraries generated for this booking.` });
    }

    const listing = booking.listing as any;
    const location = listing?.locationName || "the local area";
    const propertyName = listing.title || "Unknown Property";
    const totalDays = days || Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24),
    );

    const content = await AIService.generateItinerary(
      location,
      totalDays,
      propertyName,
      people || 2,
      groupType || "couple",
      style || "relaxed",
      budget || "moderate",
    );

    if (existing) {
      existing.content = content;
      existing.totalDays = totalDays;
      existing.preferences = { people: people || 2, groupType: groupType || "couple", style: style || "relaxed", budget: budget || "moderate" };
      existing.version += 1;
      await existing.save();
      return res.status(200).json({ message: "Itinerary regenerated.", itinerary: existing });
    }

    const itinerary = await Itinerary.create({
      user: userId,
      booking: new mongoose.Types.ObjectId(bookingId),
      listing: listing._id,
      location,
      totalDays,
      preferences: { people: people || 2, groupType: groupType || "couple", style: style || "relaxed", budget: budget || "moderate" },
      content,
    });

    return res.status(201).json({ message: "Itinerary generated and saved.", itinerary });
  },
);

export const getBookingItinerary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = req.params.bookingId as string;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.user.toString() !== userId.toString() && booking.host.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const itinerary = await Itinerary.findOne({ booking: new mongoose.Types.ObjectId(bookingId) });
    if (!itinerary) return res.status(404).json({ message: "No itinerary saved for this booking." });

    return res.status(200).json({ itinerary });
  },
);

export const updateItinerary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const id = req.params.id as string;
    const { content } = req.body;
    const userId = req.user._id;

    const itinerary = await Itinerary.findById(id);
    if (!itinerary) return res.status(404).json({ message: "Itinerary not found." });
    if (itinerary.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not your itinerary." });
    }

    itinerary.content = content;
    await itinerary.save();

    return res.status(200).json({ message: "Itinerary updated.", itinerary });
  },
);

import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../middlewares/async.middleware";
import { recommendationEngine } from "../../services/recommendation.service";
import RecommendationAnalytics from "./recommendation-analytics.model";
import UserPreference from "./user-preference.model";
import Booking from "../booking/booking.model";
import Listing from "../listing/listing.model";

export const getSimilarListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const listingId = req.params.listingId as string;

    const recommendations = await recommendationEngine.getSimilarListings(listingId);
    const collaborative = await recommendationEngine.getCollaborativeRecommendations(listingId);
    const { aiSuggestion } = await recommendationEngine.getAIEnhanced(listingId);

    return res.status(200).json({
      recommendations: recommendations.slice(0, 6),
      collaborative: collaborative.slice(0, 6),
      aiSuggestion,
    });
  },
);

export const getForYou = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id.toString();
    const recommendations = await recommendationEngine.getForYou(userId);

    return res.status(200).json({
      recommendations: recommendations.slice(0, 8),
    });
  },
);

export const getTrending = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const recommendations = await recommendationEngine.getTrending();

    return res.status(200).json({
      recommendations,
    });
  },
);

export const getRecommendationsForListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const listingId = req.params.listingId as string;

    const similar = await recommendationEngine.getSimilarListings(listingId);
    const collaborative = await recommendationEngine.getCollaborativeRecommendations(listingId);
    const { aiSuggestion } = await recommendationEngine.getAIEnhanced(listingId);

    return res.status(200).json({
      similar: similar.slice(0, 6),
      collaborative: collaborative.slice(0, 4),
      aiSuggestion,
    });
  },
);

export const trackAnalytics = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { listing, recommendedListing, source, action, sessionId } = req.body;

    if (!listing || !recommendedListing || !source || !action) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await RecommendationAnalytics.create({
      user: req.user?._id,
      listing,
      recommendedListing,
      source,
      action,
      sessionId,
    });

    return res.status(200).json({ message: "Analytics tracked." });
  },
);

export const updateUserPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;

    const bookings = await Booking.find({
      user: userId,
      status: { $in: ["confirmed", "completed"] },
    }).populate("listing", "category amenities locationName price");

    if (bookings.length === 0) {
      return res.status(200).json({ message: "No bookings to derive preferences." });
    }

    const cities = new Set<string>();
    const categories = new Set<string>();
    const amenities = new Set<string>();
    let totalBudget = 0;
    let minPrice = Infinity;
    let maxPrice = 0;

    for (const b of bookings) {
      const listing = b.listing as any;
      if (!listing) continue;
      if (listing.locationName) cities.add(listing.locationName);
      if (listing.category) categories.add(listing.category);
      if (listing.amenities) listing.amenities.forEach((a: string) => amenities.add(a));
      totalBudget += b.totalPrice;
      if (b.totalPrice < minPrice) minPrice = b.totalPrice;
      if (b.totalPrice > maxPrice) maxPrice = b.totalPrice;
    }

    const avgBudget = bookings.length > 0 ? Math.round(totalBudget / bookings.length) : 0;

    await UserPreference.findOneAndUpdate(
      { user: userId },
      {
        cities: [...cities],
        categories: [...categories],
        amenities: [...amenities],
        avgBudget,
        priceRange: {
          min: minPrice === Infinity ? 0 : minPrice,
          max: maxPrice || 100000,
        },
      },
      { upsert: true },
    );

    return res.status(200).json({ message: "Preferences updated." });
  },
);

export const getUserPreferences = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const prefs = await UserPreference.findOne({ user: userId });

    if (!prefs) {
      return res.status(200).json({ preferences: null, message: "No preferences yet." });
    }

    return res.status(200).json({ preferences: prefs });
  },
);

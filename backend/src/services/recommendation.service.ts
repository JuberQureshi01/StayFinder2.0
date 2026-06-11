import mongoose from "mongoose";
import Listing from "../modules/listing/listing.model";
import Booking from "../modules/booking/booking.model";
import UserPreference from "../modules/recommendation/user-preference.model";
import { redisClient } from "../config/redis";
import { AIService } from "./ai.service";

const CACHE_TTL = 600;
const MAX_RECOMMENDATIONS = 8;

const getCacheKey = (...parts: string[]) => `recommend:${parts.join(":")}`;

type ScoredListing = {
  _id: string;
  title: string;
  price: number;
  category: string;
  locationName: string;
  location: { type: string; coordinates: number[] };
  images: string[];
  amenities: string[];
  rating?: number;
  numReviews?: number;
  score: number;
};

async function tryCache<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  try {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: any, ttl = CACHE_TTL) {
  if (!redisClient) return;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
  } catch {}
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-gray-500";
};

const toStr = (id: any): string =>
  id && typeof id === "object" ? id.toString() : String(id);

const STATUS_APPROVED = "approved" as const;

class RecommendationEngine {
  async nearby(
    coordinates: number[],
    excludeId: string,
    maxDistance = 50000,
    limit = MAX_RECOMMENDATIONS,
  ): Promise<ScoredListing[]> {
    const listings = await Listing.find({
      _id: { $ne: excludeId },
      status: "approved",
      location: {
        $near: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: maxDistance,
        },
      },
    })
      .limit(limit)
      .lean();

    return listings.map((l) => ({
      _id: toStr(l._id),
      title: l.title,
      price: l.price,
      category: l.category,
      locationName: l.locationName,
      location: l.location,
      images: l.images,
      amenities: l.amenities,
      score: 100,
    }));
  }

  async contentBased(
    listingId: string,
    limit = MAX_RECOMMENDATIONS,
  ): Promise<ScoredListing[]> {
    const source = await Listing.findById(listingId).lean();
    if (!source) return [];

    const candidates = await Listing.find({
      _id: { $ne: source._id },
      status: STATUS_APPROVED,
    })
      .limit(50)
      .lean();

    const scored: ScoredListing[] = candidates.map((l) => {
      let score = 0;

      if (l.category === source.category) score += 30;
      if (l.locationName === source.locationName) score += 25;

      const sharedAmenities =
        l.amenities?.filter((a) => source.amenities?.includes(a)).length || 0;
      score += Math.min(sharedAmenities * 8, 25);

      const priceDiff = Math.abs(l.price - source.price);
      const priceRatio = priceDiff / Math.max(source.price, 1);
      if (priceRatio <= 0.1) score += 15;
      else if (priceRatio <= 0.25) score += 10;
      else if (priceRatio <= 0.5) score += 5;

      return {
        _id: toStr(l._id),
        title: l.title,
        price: l.price,
        category: l.category,
        locationName: l.locationName,
        location: l.location,
        images: l.images,
        amenities: l.amenities,
        rating: l.rating,
        numReviews: l.numReviews,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async collaborativeFiltering(
    listingId: string,
    limit = MAX_RECOMMENDATIONS,
  ): Promise<ScoredListing[]> {
    const bookings = await Booking.find({
      listing: listingId,
      status: { $in: ["confirmed", "completed"] },
    }).select("user");

    const userIds = [...new Set(bookings.map((b) => b.user.toString()))];
    if (userIds.length === 0) return [];

    const otherBookings = await Booking.aggregate([
      {
        $match: {
          user: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) },
          listing: { $ne: new mongoose.Types.ObjectId(listingId) },
        },
      },
      { $group: { _id: "$listing", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    if (otherBookings.length === 0) return [];

    const listingIds = otherBookings.map((b) => b._id);
    const listings = await Listing.find({ _id: { $in: listingIds } }).lean();

    const listingMap = new Map(listings.map((l) => [toStr(l._id), l]));
    const maxCount = otherBookings[0]?.count || 1;

    return otherBookings
      .map((b) => {
        const l = listingMap.get(toStr(b._id));
        if (!l) return null;
        return {
          _id: toStr(l._id),
          title: l.title,
          price: l.price,
          category: l.category,
          locationName: l.locationName,
          location: l.location,
          images: l.images,
          amenities: l.amenities,
          rating: l.rating,
          numReviews: l.numReviews,
          score: Math.round((b.count / maxCount) * 100),
        } as ScoredListing;
      })
      .filter((l): l is ScoredListing => l !== null);
  }

  async personalized(
    userId: string,
    limit = MAX_RECOMMENDATIONS,
  ): Promise<ScoredListing[]> {
    const pref = await UserPreference.findOne({ user: userId });
    if (!pref || pref.categories.length === 0) return [];

    const bookedIds = await this.getUserBookedListings(userId);

    const query: any = {
      _id: { $nin: bookedIds },
      status: "approved",
    };

    if (pref.cities.length > 0) {
      query.locationName = { $in: pref.cities };
    }
    if (pref.categories.length > 0) {
      query.category = { $in: pref.categories };
    }
    if (pref.amenities.length > 0) {
      query.amenities = { $in: pref.amenities };
    }
    if (pref.avgBudget > 0) {
      query.price = {
        $gte: Math.round(pref.avgBudget * 0.5),
        $lte: Math.round(pref.avgBudget * 1.5),
      };
    }

    const listings = await Listing.find(query).limit(limit).lean();

    const scored: ScoredListing[] = listings.map((l) => {
      let score = 50;

      if (pref.cities.includes(l.locationName)) score += 15;
      if (pref.categories.includes(l.category)) score += 15;

      const sharedAmenities =
        l.amenities?.filter((a) => pref.amenities.includes(a)).length || 0;
      score += Math.min(sharedAmenities * 5, 20);

      return {
        _id: toStr(l._id),
        title: l.title,
        price: l.price,
        category: l.category,
        locationName: l.locationName,
        location: l.location,
        images: l.images,
        amenities: l.amenities,
        rating: l.rating,
        numReviews: l.numReviews,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async getSimilarListings(listingId: string): Promise<ScoredListing[]> {
    const cacheKey = getCacheKey("similar", listingId);
    const cached = await tryCache<ScoredListing[]>(cacheKey);
    if (cached) return cached;

    const similar = await this.contentBased(listingId, MAX_RECOMMENDATIONS);
    await setCache(cacheKey, similar);
    return similar;
  }

  async getForYou(userId: string): Promise<ScoredListing[]> {
    const cacheKey = getCacheKey("foryou", userId);
    const cached = await tryCache<ScoredListing[]>(cacheKey);
    if (cached) return cached;

    let results = await this.personalized(userId, MAX_RECOMMENDATIONS);

    if (results.length < 4) {
      const fallbackIds = await this.getUserBookedListings(userId);
      const existingIds = results.map((r) => r._id);
      const fallback = await Listing.find({
        _id: { $nin: [...fallbackIds, ...existingIds] },
        status: "approved",
      })
        .sort({ rating: -1, numReviews: -1 })
        .limit(MAX_RECOMMENDATIONS - results.length)
        .lean();

      results.push(
        ...fallback.map((l) => ({
          _id: toStr(l._id),
          title: l.title,
          price: l.price,
          category: l.category,
          locationName: l.locationName,
          location: l.location,
          images: l.images,
          amenities: l.amenities,
          rating: l.rating,
          numReviews: l.numReviews,
          score: 50,
        })),
      );
    }

    await setCache(cacheKey, results);
    return results;
  }

  async getTrending(limit = MAX_RECOMMENDATIONS): Promise<ScoredListing[]> {
    const cacheKey = getCacheKey("trending");
    const cached = await tryCache<ScoredListing[]>(cacheKey);
    if (cached) return cached;

    const listings = await Listing.find({ status: "approved" })
      .sort({ rating: -1, numReviews: -1 })
      .limit(limit)
      .lean();

    const result: ScoredListing[] = listings.map((l, i) => ({
      _id: toStr(l._id),
      title: l.title,
      price: l.price,
      category: l.category,
      locationName: l.locationName,
      location: l.location,
      images: l.images,
      amenities: l.amenities,
      rating: l.rating,
      numReviews: l.numReviews,
      score: Math.max(0, 100 - i * 10),
    }));

    await setCache(cacheKey, result, 1200);
    return result;
  }

  async getCollaborativeRecommendations(
    listingId: string,
  ): Promise<ScoredListing[]> {
    const cacheKey = getCacheKey("collab", listingId);
    const cached = await tryCache<ScoredListing[]>(cacheKey);
    if (cached) return cached;

    const results = await this.collaborativeFiltering(
      listingId,
      MAX_RECOMMENDATIONS,
    );
    await setCache(cacheKey, results, 1200);
    return results;
  }

  async getAIEnhanced(
    listingId: string,
  ): Promise<{ recommendations: ScoredListing[]; aiSuggestion?: string }> {
    const similar = await this.getSimilarListings(listingId);
    if (similar.length === 0) return { recommendations: [] };

    const source = await Listing.findById(listingId).lean();
    if (!source) return { recommendations: similar };

    try {
      const titles = similar
        .slice(0, 4)
        .map((s) => s.title)
        .join(", ");
      const prompt = `A user is viewing "${source.title}" (${source.category}, ${source.locationName}). Why might they also like: ${titles}? Respond in one short sentence, no greetings.`;
      const aiSuggestion = await AIService.generateRecommendation(prompt);
      return { recommendations: similar, aiSuggestion };
    } catch {
      return { recommendations: similar };
    }
  }

  private async getUserBookedListings(userId: string): Promise<string[]> {
    const bookings = await Booking.find({
      user: userId,
      status: { $in: ["confirmed", "completed", "cancelled"] },
    }).select("listing");
    return [...new Set(bookings.map((b) => b.listing.toString()))];
  }
}

export const recommendationEngine = new RecommendationEngine();
export { getScoreColor };

import { Response } from "express";
import Review from "./review.model";
import Booking from "../booking/booking.model";
import Listing from "../listing/listing.model";
import { AIService } from "../../services/ai.service";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { recalculateListingStats } from "../../services/review.service";

export const createReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listingId = req.params.listingId as string;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const hasBooked = await Booking.findOne({
    user: userId,
    listing: listingId,
    status: { $in: ["confirmed", "completed"] },
  });

  if (!hasBooked) {
    return res.status(403).json({ message: "You can only review properties you have booked." });
  }

  const existingReview = await Review.findOne({ user: userId, listing: listingId });
  if (existingReview) {
    return res.status(400).json({ message: "You have already reviewed this stay." });
  }

  const review = new Review({
    user: userId,
    listing: listingId,
    booking: hasBooked._id,
    rating,
    comment,
  });

  await review.save();
  await recalculateListingStats(listingId as string);

  return res.status(201).json({ message: "Review posted.", review });
});

export const getListingReviews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const reviews = await Review.find({ listing: req.params.listingId as string })
    .populate("user", "profile.name email")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ message: "Reviews retrieved.", count: reviews.length, reviews });
});

export const getReviewSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const reviews = await Review.find({ listing: req.params.listingId })
    .select("rating comment")
    .limit(100)
    .lean();

  if (reviews.length === 0) {
    return res.status(200).json({ summary: null });
  }

  const summary = await AIService.generateReviewSummary(reviews);
  return res.status(200).json({ summary });
});

export const updateReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ message: "Review not found." });
  if (review.user.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Not authorized." });
  }

  const hoursElapsed = (Date.now() - new Date((review as any).createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursElapsed > 48) {
    return res.status(403).json({ message: "Review can only be edited within 48 hours." });
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  await recalculateListingStats(review.listing.toString());

  return res.status(200).json({ message: "Review updated.", review });
});

export const replyToReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ message: "Reply text is required." });
  }

  const review = await Review.findById(id).populate("listing", "host");
  if (!review) return res.status(404).json({ message: "Review not found." });

  const listing = await Listing.findById(review.listing);
  if (!listing || listing.host.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the host can reply." });
  }

  review.reply = { text: text.trim(), createdAt: new Date() };
  await review.save();

  return res.status(200).json({ message: "Reply posted.", review });
});

export const deleteReview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) return res.status(404).json({ message: "Review not found." });

  if (review.user.toString() !== userId.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized." });
  }

  const listingId = review.listing.toString();
  await review.deleteOne();
  await recalculateListingStats(listingId);

  return res.status(200).json({ message: "Review deleted.", deletedReviewId: id });
});

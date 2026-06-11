import { Response } from "express";
import Review from "./review.model";
import Booking from "../booking/booking.model";
import Listing from "../listing/listing.model";
import { AIService } from "../../services/ai.service";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

/**
 * Recaps and updates the global average rating on a listing dynamically
 */
const recalculateListingStats = async (listingId: string) => {
  const stats = await Review.aggregate([
    { $match: { listing: listingId } },
    {
      $group: {
        _id: "$listing",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Listing.findByIdAndUpdate(listingId, {
      rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal place (e.g., 4.7)
      numReviews: stats[0].numReviews,
    });
  } else {
    // Reset to defaults if all reviews are deleted
    await Listing.findByIdAndUpdate(listingId, { rating: 0, numReviews: 0 });
  }
};

/**
 * @desc    Submit a new verified customer property rating review
 * @route   POST /api/reviews/:listingId
 * @access  Protected (Verified Guest Only)
 */
export const createReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { listingId } = req.params;
    const { rating, comment } = req.body; // Validated by Zod HOF
    const userId = req.user._id;

    // 1. The Gatekeeper: Verify the user stayed at this location
    const hasBooked = await Booking.findOne({
      user: userId,
      listing: listingId,
      status: { $in: ["confirmed", "completed"] },
    });

    if (!hasBooked) {
      return res.status(403).json({
        message:
          "Access Denied. You are only authorized to review properties you have actively booked.",
      });
    }

    // 2. Idempotency Check: Prevent duplicate reviews from the same account on a listing
    const existingReview = await Review.findOne({
      user: userId,
      listing: listingId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({
          message: "You have already submitted a review for this stay.",
        });
    }

    // 3. Persist the review
    const review = new Review({
      user: userId,
      listing: listingId as any,
      booking: hasBooked._id as any,
      rating,
      comment,
    });
    await review.save();

    // 4. Trigger database math update
    await recalculateListingStats(listingId as any );

    return res
      .status(201)
      .json({ message: "Review posted successfully.", review });
  },
);

/**
 * @desc    Fetch all reviews bound to a single listing entity
 * @route   GET /api/reviews/listing/:listingId
 * @access  Public (Shielded by Redis Cache inside routes)
 */
export const getListingReviews = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { listingId } = req.params;

    const reviews = await Review.find({ listing: listingId })
      .populate("user", "profile.name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Reviews compiled successfully.",
      count: reviews.length,
      reviews,
    });
  },
);

/**
 * @desc    AI-generated summary of all reviews for a listing
 * @route   GET /api/reviews/listing/:listingId/summary
 * @access  Public
 */
export const getReviewSummary = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { listingId } = req.params;

    const reviews = await Review.find({ listing: listingId })
      .select("rating comment")
      .limit(100)
      .lean();

    if (reviews.length === 0) {
      return res.status(200).json({ summary: null });
    }

    const summary = await AIService.generateReviewSummary(reviews);
    return res.status(200).json({ summary });
  },
);

/**
 * @desc    Mutates a historic review if it falls within the 48-hour modification allowance window
 * @route   PUT /api/reviews/:id
 * @access  Protected (Owner Only Checkpoint)
 */
export const updateReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res
        .status(404)
        .json({ message: "Target review resource file not found." });
    }

    // 1. Ownership Guard Check
    if (review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({
          message: "Unauthorized asset manipulation execution attempted.",
        });
    }

    // 2. POLICY INTERCEPTOR: Calculate elapsed delta hours from generation timestamp
    const msElapsed = Date.now() - new Date((review as any)?.createdAt).getTime();
    const hoursElapsed = msElapsed / (1000 * 60 * 60);
    const LOCK_WINDOW_HOURS = 48;

    if (hoursElapsed > LOCK_WINDOW_HOURS) {
      return res.status(403).json({
        message: `This review is permanently locked. Modifications are forbidden after ${LOCK_WINDOW_HOURS} hours of publication.`,
      });
    }

    // 3. Apply changes dynamically
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    await review.save();

    // 4. Redo rating aggregates synchronously across the dataset
    await recalculateListingStats(review.listing.toString());

    return res.status(200).json({
      message: "Review updated successfully within the authorized time window.",
      review,
    });
  },
);

/**
 * @desc    Host replies to a review
 * @route   POST /api/reviews/:id/reply
 * @access  Protected (Host only)
 */
export const replyToReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const review = await Review.findById(id).populate("listing", "host");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const listing = await Listing.findById(review.listing);
    if (!listing || listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the host can reply to this review" });
    }

    review.reply = { text: text.trim(), createdAt: new Date() };
    await review.save();

    return res.status(200).json({ message: "Reply posted", review });
  },
);

/**
 * @desc    Removes an active review record out of the cluster collections database index logs
 * @route   DELETE /api/reviews/:id
 * @access  Protected (Owner or System Admin Guarded)
 */
export const deleteReview = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);
    if (!review) {
      return res
        .status(404)
        .json({ message: "Target review resource reference trace missing." });
    }

    // Authorization Check: Only the original poster or a system administrator can purge reviews
    if (
      review.user.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Forbidden context operational invocation error." });
    }

    const associatedListingId = review.listing.toString();
    await review.deleteOne();

    // Recalculate average calculations to account for deleted metrics
    await recalculateListingStats(associatedListingId);

    return res.status(200).json({
      message: "Review completely removed from system clusters.",
      deletedReviewId: id,
    });
  },
);

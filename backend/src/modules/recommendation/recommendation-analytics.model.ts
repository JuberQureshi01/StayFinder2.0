import mongoose, { Schema } from "mongoose";

export type RecommendationSource = "home" | "listing_details" | "booking_success" | "trips" | "wishlist";
export type RecommendationAction = "view" | "click" | "booking";

export interface IRecommendationAnalytics {
  user?: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  recommendedListing: mongoose.Types.ObjectId;
  source: RecommendationSource;
  action: RecommendationAction;
  sessionId?: string;
}

const recommendationAnalyticsSchema = new Schema<IRecommendationAnalytics>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    recommendedListing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    source: {
      type: String,
      enum: ["home", "listing_details", "booking_success", "trips", "wishlist"],
      required: true,
    },
    action: {
      type: String,
      enum: ["view", "click", "booking"],
      required: true,
    },
    sessionId: { type: String },
  },
  { timestamps: true },
);

recommendationAnalyticsSchema.index({ listing: 1, action: 1 });
recommendationAnalyticsSchema.index({ recommendedListing: 1 });

const RecommendationAnalytics = mongoose.model<IRecommendationAnalytics>(
  "RecommendationAnalytics",
  recommendationAnalyticsSchema,
);
export default RecommendationAnalytics;

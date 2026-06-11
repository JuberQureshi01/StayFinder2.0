import mongoose, { Schema } from "mongoose";

export interface IReview {
  user: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;

  rating: number;
  comment: string;
  reply?: {
    text: string;
    createdAt: Date;
  };
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
    },
    reply: {
      text: { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true },
);

reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;

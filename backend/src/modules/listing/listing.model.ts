import { Schema } from "mongoose";
import mongoose from "mongoose";

interface IListing {
  title: string;
  description: string;
  amenities: string[];
  price: number;
  category: string;
  locationName: string;
  location: {
    type: "Point";
    coordinates: number[];
  };
  images: string[];
  host: mongoose.Types.ObjectId;
  status?: "pending" | "approved" | "rejected";
  blockedDates: Date[];
  rating?: number;
  numReviews?: number;
  cancellationPolicy?: "flexible" | "moderate" | "strict";
  checkInTime?: string;
  checkOutTime?: string;
  maxGuests?: number;
  cleaningFee?: number;
}

const listingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    amenities: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: "Trending" }, 
    locationName: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    images: [{ type: String, required: true }],
    host: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
    blockedDates: [{ type: Date }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    cancellationPolicy: { type: String, enum: ["flexible", "moderate", "strict"], default: "moderate" },
    checkInTime: { type: String, default: "3:00 PM" },
    checkOutTime: { type: String, default: "11:00 AM" },
    maxGuests: { type: Number, default: 4, min: 1 },
    cleaningFee: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Indexes for hyper-fast querying
listingSchema.index({ location: "2dsphere" });
listingSchema.index({ category: 1 });
listingSchema.index({ host: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ price: 1 });

const Listing = mongoose.model<IListing>("Listing", listingSchema);

export default Listing;

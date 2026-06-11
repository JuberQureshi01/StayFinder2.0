import mongoose, { Schema } from "mongoose";

export interface IItinerary {
  user: mongoose.Types.ObjectId;
  booking?: mongoose.Types.ObjectId;
  listing: mongoose.Types.ObjectId;
  location: string;
  totalDays: number;
  preferences: {
    people: number;
    groupType: string;
    style: string;
    budget: string;
  };
  content: string;
  version: number;
}

const itinerarySchema = new Schema<IItinerary>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    location: { type: String, required: true },
    totalDays: { type: Number, required: true },
    preferences: {
      people: { type: Number, default: 2 },
      groupType: { type: String, default: "couple" },
      style: { type: String, default: "relaxed" },
      budget: { type: String, default: "moderate" },
    },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

itinerarySchema.index({ booking: 1 });
itinerarySchema.index({ user: 1 });
itinerarySchema.index({ listing: 1 });
itinerarySchema.index({ user: 1, listing: 1 });

const Itinerary = mongoose.model<IItinerary>("Itinerary", itinerarySchema);
export default Itinerary;

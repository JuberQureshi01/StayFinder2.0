import mongoose, { Schema } from "mongoose";

export interface IUserPreference {
  user: mongoose.Types.ObjectId;
  cities: string[];
  categories: string[];
  amenities: string[];
  avgBudget: number;
  priceRange: { min: number; max: number };
  updatedAt: Date;
}

const userPreferenceSchema = new Schema<IUserPreference>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cities: [{ type: String }],
    categories: [{ type: String }],
    amenities: [{ type: String }],
    avgBudget: { type: Number, default: 0 },
    priceRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 100000 },
    },
  },
  { timestamps: true },
);

userPreferenceSchema.index({ user: 1 });

const UserPreference = mongoose.model<IUserPreference>("UserPreference", userPreferenceSchema);
export default UserPreference;

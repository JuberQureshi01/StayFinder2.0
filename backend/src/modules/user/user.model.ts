import { Schema } from "mongoose";
import mongoose from "mongoose";

export interface IUser {
  email: string;
  password: string;
  profile: {
    name: string;
    profilePicture: string;
    contactNumber: string;
    verified?: boolean;
  };
  role: "user" | "admin" | "host";
  banned?: boolean;
  wishlist: mongoose.Types.ObjectId[];
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
}

  const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    profile: {
      name: { type: String, required: true },
      profilePicture: { type: String },
      contactNumber: { type: String },
      verified: { type: Boolean, default: false },
    },
    role: { type: String, enum: ["user", "admin", "host"], default: "user" },
    banned: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;

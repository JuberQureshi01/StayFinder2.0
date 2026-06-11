import mongoose, { Schema } from "mongoose";

export interface IHostApplication {
  user: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  idProofUrl?: string;
  propertyType: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
}

const hostApplicationSchema = new Schema<IHostApplication>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    idProofUrl: { type: String },
    propertyType: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

const HostApplication = mongoose.model<IHostApplication>("HostApplication", hostApplicationSchema);
export default HostApplication;

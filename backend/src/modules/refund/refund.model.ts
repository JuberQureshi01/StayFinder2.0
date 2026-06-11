import mongoose, { Schema } from "mongoose";

export interface IRefund {
  booking: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  paymentId: string;
  originalAmount: number;
  refundAmount: number;
  deductionAmount: number;
  cancellationPolicy: string;
  reason?: string;
  status: "processing" | "completed" | "failed";
  razorpayRefundId?: string;
  processedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

const refundSchema = new Schema<IRefund>(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paymentId: { type: String, required: true },
    originalAmount: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
    deductionAmount: { type: Number, required: true },
    cancellationPolicy: { type: String, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    razorpayRefundId: { type: String },
    processedAt: { type: Date },
    failedAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true },
);

refundSchema.index({ booking: 1 });
refundSchema.index({ user: 1 });

const Refund = mongoose.model<IRefund>("Refund", refundSchema);
export default Refund;

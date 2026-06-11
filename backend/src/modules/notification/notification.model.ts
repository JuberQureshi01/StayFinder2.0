import mongoose, { Schema } from "mongoose";

export interface INotification {
  user: mongoose.Types.ObjectId;
  type: "booking_confirmed" | "payment_success" | "new_message" | "new_booking" | "review_received" | "booking_cancelled" | "refund_processed" | "refund_failed";
  title: string;
  message: string;
  link?: string;
  read: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["booking_confirmed", "payment_success", "new_message", "new_booking", "review_received", "booking_cancelled", "refund_processed", "refund_failed"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;

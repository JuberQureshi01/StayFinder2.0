import mongoose, { Schema } from "mongoose";

export interface IBooking {
  user: mongoose.Types.ObjectId; // guest
  host: mongoose.Types.ObjectId; // listing owner
  listing: mongoose.Types.ObjectId;

  checkIn: Date;
  checkOut: Date;

  totalPrice: number;

  status: "pending" | "confirmed" | "cancelled" | "completed";

  razorpayOrderId: string;
  razorpayPaymentId: string;
  cancellationReason?: string;
  paymentId?: string;
  refunded?: boolean;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },

    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    cancellationReason: { type: String },
    paymentId: { type: String },
    refunded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 🔥 Useful indexes
bookingSchema.index({ user: 1 });
bookingSchema.index({ host: 1 });
bookingSchema.index({ listing: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });

const Booking = mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;

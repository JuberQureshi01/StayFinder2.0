import mongoose, { Schema } from "mongoose";

export interface IMessage {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;

  text: string;

  isRead: boolean;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ booking: 1, createdAt: 1 });

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;

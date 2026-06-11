import { Response } from "express";
import Message from "./message.model";
import Booking from "../booking/booking.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

/**
 * @desc    Fetches message history for a specific booking chat room
 * @route   GET /api/chat/:bookingId
 * @access  Protected
 */
export const getChatHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // 1. Verify user is authorized to view this chat (must be the guest or the host)
    const booking = await Booking.findById(bookingId);
    if (!booking)
      return res.status(404).json({ message: "Booking not found." });

    if (
      booking.user.toString() !== userId.toString() &&
      booking.host.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this conversation." });
    }

    // 2. Fetch messages
    const messages = await Message.find({ booking: bookingId })
      .populate("sender", "profile.name")
      .sort({ createdAt: 1 }) // Oldest to newest
      .lean();

    return res.status(200).json({
      message: "Chat history retrieved successfully.",
      messages,
    });
  },
);

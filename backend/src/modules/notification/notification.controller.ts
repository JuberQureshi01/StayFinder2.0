import { Response } from "express";
import Notification from "./notification.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export const getNotifications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  },
);

export const markAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
    );
    return res.status(200).json({ message: "Notification marked as read" });
  },
);

export const markAllAsRead = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true },
    );
    return res.status(200).json({ message: "All notifications marked as read" });
  },
);

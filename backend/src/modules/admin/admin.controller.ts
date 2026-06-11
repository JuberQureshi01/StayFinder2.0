import { Response } from "express";
import User from "../user/user.model";
import Listing from "../listing/listing.model";
import Booking from "../booking/booking.model";
import Review from "../review/review.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

// =====================
// ANALYTICS DASHBOARD
// =====================
export const getDashboardStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const [totalUsers, totalHosts, totalListings, totalBookings, totalRevenue] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "host" }),
        Listing.countDocuments(),
        Booking.countDocuments({ status: { $in: ["confirmed", "completed"] } }),
        Booking.aggregate([
          { $match: { status: { $in: ["confirmed", "completed"] } } },
          { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
      ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const monthlyRevenue = await Booking.aggregate([
      { $match: { status: { $in: ["confirmed", "completed"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    const categoryDistribution = await Listing.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalHosts,
        totalListings,
        totalBookings,
        totalRevenue: revenue,
        monthlyRevenue,
        categoryDistribution,
      },
    });
  },
);

// =====================
// USER MANAGEMENT
// =====================
export const getAllUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", pageSize = "20", role, search } = req.query as any;
    const query: any = {};
    if (role && role !== "all") query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { "profile.name": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const [users, total] = await Promise.all([
      User.find(query).select("-password").skip(skip).limit(Number(pageSize)).sort({ createdAt: -1 }).lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({ users, total, page: Number(page), pageSize: Number(pageSize) });
  },
);

export const banUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot ban yourself" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.set("banned", true);
    await user.save();
    return res.status(200).json({ message: "User banned successfully" });
  },
);

export const unbanUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.set("banned", false);
    await user.save();
    return res.status(200).json({ message: "User unbanned successfully" });
  },
);

// =====================
// LISTING MODERATION
// =====================
export const getAllListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", pageSize = "20", status } = req.query as any;
    const query: any = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate("host", "profile.name email")
        .skip(skip)
        .limit(Number(pageSize))
        .sort({ createdAt: -1 })
        .lean(),
      Listing.countDocuments(query),
    ]);

    return res.status(200).json({ listings, total, page: Number(page), pageSize: Number(pageSize) });
  },
);

export const approveListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { status: "approved" }, { returnDocument: "after" });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.status(200).json({ message: "Listing approved", listing });
  },
);

export const rejectListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { status: "rejected" }, { returnDocument: "after" });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.status(200).json({ message: "Listing rejected", listing });
  },
);

// =====================
// BOOKING MONITORING
// =====================
export const getAllBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page = "1", pageSize = "20", status } = req.query as any;
    const query: any = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("user", "profile.name email")
        .populate("host", "profile.name email")
        .populate("listing", "title price")
        .skip(skip)
        .limit(Number(pageSize))
        .sort({ createdAt: -1 })
        .lean(),
      Booking.countDocuments(query),
    ]);

    return res.status(200).json({ bookings, total, page: Number(page), pageSize: Number(pageSize) });
  },
);

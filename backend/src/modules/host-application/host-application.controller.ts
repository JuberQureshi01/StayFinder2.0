import { Response } from "express";
import HostApplication from "./host-application.model";
import User from "../user/user.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export const applyForHost = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const { fullName, email, phone, address, city, state, propertyType, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.role === "host" && user.profile?.verified) {
      return res.status(400).json({ message: "You are already a verified host." });
    }

    const pending = await HostApplication.findOne({ user: userId, status: "pending" });
    if (pending) {
      return res.status(400).json({ message: "You already have a pending application." });
    }

    let idProofUrl: string | undefined;
    if (req.file) {
      idProofUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    // If a rejected application exists, update it instead of creating a new one
    const existing = await HostApplication.findOne({ user: userId }).sort({ createdAt: -1 });
    let application;
    if (existing && existing.status === "rejected") {
      existing.set({ fullName, email, phone, address, city, state, propertyType, reason, idProofUrl, status: "pending", adminNote: undefined, reviewedBy: undefined, reviewedAt: undefined });
      application = await existing.save();
    } else {
      application = await HostApplication.create({
        user: userId,
        fullName, email, phone, address, city, state, idProofUrl, propertyType, reason,
      });
    }

    return res.status(201).json({ message: "Application submitted for review.", application });
  },
);

export const getMyApplication = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const application = await HostApplication.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ application });
  },
);

export const getPendingApplications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const applications = await HostApplication.find({ status: "pending" })
      .populate("user", "profile.name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ applications });
  },
);

export const getAllApplications = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { status } = req.query as any;
    const query: any = {};
    if (status) query.status = status;
    const applications = await HostApplication.find(query)
      .populate("user", "profile.name email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ applications });
  },
);

export const approveApplication = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const application = await HostApplication.findById(id);
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (application.status !== "pending") return res.status(400).json({ message: "Application already reviewed." });

    application.status = "approved";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    await User.findByIdAndUpdate(application.user, {
      role: "host",
      "profile.verified": true,
    });

    return res.status(200).json({ message: "Host application approved. User is now a host." });
  },
);

export const rejectApplication = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { adminNote } = req.body;
    const application = await HostApplication.findById(id);
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (application.status !== "pending") return res.status(400).json({ message: "Application already reviewed." });

    application.status = "rejected";
    application.adminNote = adminNote || "Your application was not approved.";
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    return res.status(200).json({ message: "Application rejected.", application });
  },
);

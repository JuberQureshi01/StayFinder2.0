import { Response } from "express";
import User from "./user.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";


export const getUserProfile = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    return res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  },
);

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // 1. Update text fields
  if (req.body.name) user.profile.name = req.body.name;

  // 2. Handle the Image File
  if (req.file) {
    // Convert the file buffer to a Base64 string so we can save it directly to MongoDB
    // (In the future, you can replace this with a Cloudinary upload function)
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    user.profile.profilePicture = base64Image;
  }

  const updatedUser = await user.save();

  return res.status(200).json({
    message: "Profile updated successfully",
    user: {
      _id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
    },
  });
});

// @desc    Toggle listing in wishlist
// @route   POST /api/users/wishlist/:listingId
// @access  Private
export const toggleWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { listingId } = req.params;
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  // Check if the listing is already in the wishlist
  const isWishlisted = user.wishlist.includes(listingId as any);

  if (isWishlisted) {
    // Remove it
    user.wishlist = user.wishlist.filter((id) => id.toString() !== listingId);
  } else {
    // Add it
    user.wishlist.push(listingId as any);
  }

  const updatedUser = await user.save();

  return res.status(200).json({
    message: isWishlisted ? "Removed from wishlist" : "Saved to wishlist",
    user: {
      _id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
      wishlist: updatedUser.wishlist,
    },
  });
});


export const getUserWishlist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;

    const userWithWishlist = await User.findById(userId)
      .select("wishlist")
      .populate({
        path: "wishlist",
        select: "title price location images rating numReviews", // Pull only data needed for UI cards
      })
      .lean();

    if (!userWithWishlist) {
      return res.status(404).json({ message: "User account missing." });
    }

    return res.status(200).json({
      message: "Wishlist records compiled successfully.",
      count: userWithWishlist.wishlist.length,
      wishlist: userWithWishlist.wishlist,
    });
  },
);

// @desc    Upgrade user role to Host
// @route   PUT /api/users/become-host
// @access  Private
export const becomeHost = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (user.role === "host") {
    return res.status(400).json({ message: "You are already a host!" });
  }

  // Upgrade the role
  user.role = "host";
  const updatedUser = await user.save();

  return res.status(200).json({
    message: "Congratulations! You are now a host.",
    user: {
      _id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
      profile: updatedUser.profile,
      wishlist: updatedUser.wishlist,
    },
  });
});

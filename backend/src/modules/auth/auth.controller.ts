import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../user/user.model";
import { asyncHandler } from "../../middlewares/async.middleware";
import { OAuth2Client } from "google-auth-library";
import { EmailService } from "../../services/email.service";
import crypto from "crypto";

// Initialize Google Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = asyncHandler(async (req: Request, res: Response) => {
  // Payload validation and email string lowercasing are already completed by Zod validation HOF
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User already exists with this email address" });
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await User.create({
    email,
    password: hashedPassword,
    profile: {
      name,
    },
  });

  const token = jwt.sign(
    { id: newUser._id, role: newUser.role || "user" },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return res.status(201).json({
    message: "User registered successfully",
    token,
    data: {
      id: newUser._id,
      email: newUser.email,
      name: newUser.profile?.name,
      role: newUser.role || "user",
      wishlist: [],
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Explicitly select the hidden password buffer payload field
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password) {
    return res
      .status(404)
      .json({ message: "Invalid email or password configuration" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ message: "Invalid email or password configuration" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role || "user" },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    data: {
      id: user._id,
      email: user.email,
      name: user.profile?.name,
      role: user.role || "user",
      wishlist: user.wishlist || [],
    },
  });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const targetUser = (req as any).user;
  if (!targetUser) {
    return res
      .status(401)
      .json({ message: "Unauthorized profile context access request" });
  }

  const fetchedProfile = await User.findById(targetUser._id);
  if (!fetchedProfile) {
    return res
      .status(404)
      .json({ message: "User profile record data trace missing" });
  }

  return res.status(200).json({
    message: "Profile details retrieved successfully",
    data: fetchedProfile,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json({
    message:
      "Logout event executed successfully. Session tokens invalidated locally.",
  });
});

/**
 * @desc    Verifies Google ID Token and issues local application session JWT
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role = "user" } = req.body; // Role defaults to user if not specified

  if (!idToken) {
    return res.status(400).json({ message: "Google ID Token is missing." });
  }

  // 1. Cryptographically verify the token with Google's servers
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    return res
      .status(401)
      .json({ message: "Invalid Google token payload structure." });
  }

  const { email, name, picture } = payload;

  // 2. Check if user already exists
  let user = await User.findOne({ email });

  // 3. If they don't exist, instantly register them
  if (!user) {
    // Generate a secure random password since they use Google to log in
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      email,
      password: hashedPassword,
      role,
      profile: {
        name: name || "Google User",
        // You could add a picture field to your User model to store the Google Avatar!
      },
    });
  }

  // 4. Issue standard native JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return res.status(200).json({
    message: "Google OAuth authentication successful.",
    token,
    data: {
      id: user._id,
      email: user.email,
      name: user.profile?.name,
      role: user.role,
      wishlist: user.wishlist || [],
    },
  });
});

/**
 * @desc    Generate password reset token and email it to user
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "No user found with that email." });

  // 1. Generate a raw random string
  const resetToken = (crypto as any).randomBytes(20).toString("hex");

  // 2. Hash the string and save it to the database (so if DB is hacked, tokens are safe)
  user.resetPasswordToken = (crypto as any).createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  
  await user.save({ validateBeforeSave: false });

  // 3. Create the frontend URL that they will click in the email
  const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(",")[0] || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  // 4. Send the email (You will need to add this method to your EmailService!)
  try {
    await EmailService.sendPasswordReset(user.email, resetUrl);
    return res.status(200).json({ message: "Password reset link sent to email." });
    } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ message: "Email could not be sent." });
  }
});

/**
 * @desc    Reset password using the emailed token
 * @route   PUT /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  // 1. Re-hash the token from the URL to compare with the database
  const resetPasswordToken = (crypto as any).createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }, // Ensure token hasn't expired
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

  // 2. Hash the new password and save it
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  
  // 3. Clear the reset fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return res.status(200).json({ message: "Password successfully reset. You can now log in." });
});
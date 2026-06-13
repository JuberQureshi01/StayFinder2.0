import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../modules/user/user.model";
import { OAuth2Client } from "google-auth-library";
import { EmailService } from "./email.service";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (userId: string, role: "user" | "host" | "admin") => {
  return jwt.sign(
    { id: userId, role: role || "user" },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );
};

const buildUserResponse = (user: any) => ({
  id: user._id,
  email: user.email,
  name: user.profile?.name,
  role: user.role || "user",
  wishlist: user.wishlist || [],
});

export const registerUser = async (name: string, email: string, password: string) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw { statusCode: 400, message: "User already exists with this email address" };
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = await User.create({
    email,
    password: hashedPassword,
    profile: { name },
  });

  const token = signToken(newUser._id.toString(), newUser.role || "user");
  return { token, data: buildUserResponse(newUser) };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !user.password) {
    throw { statusCode: 404, message: "Invalid email or password" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { statusCode: 401, message: "Invalid email or password" };
  }

  const token = signToken(user._id.toString(), user.role || "user");
  return { token, data: buildUserResponse(user) };
};

export const googleLoginUser = async (idToken: string, role: string) => {
  if (!idToken) {
    throw { statusCode: 400, message: "Google ID Token is missing." };
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw { statusCode: 401, message: "Invalid Google token payload." };
  }

  const { email, name } = payload;

  let user = await User.findOne({ email });

  if (!user) {
    const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    user = await User.create({
      email,
      password: hashedPassword,
      role: (role || "user") as "user" | "host" | "admin",
      profile: { name: name || "Google User" },
    });
  }

  const token = signToken(user._id.toString(), user.role || "user");
  return { token, data: buildUserResponse(user) };
};

export const forgotPasswordService = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw { statusCode: 404, message: "No user found with that email." };
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  const frontendUrl = process.env.FRONTEND_URL || process.env.ALLOWED_ORIGINS?.split(",")[0] || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  try {
    await EmailService.sendPasswordReset(user.email, resetUrl);
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw { statusCode: 500, message: "Email could not be sent." };
  }
};

export const resetPasswordService = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw { statusCode: 400, message: "Invalid or expired reset token." };
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
};

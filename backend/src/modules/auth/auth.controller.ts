import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/async.middleware";
import {
  registerUser,
  loginUser,
  googleLoginUser,
  forgotPasswordService,
  resetPasswordService,
} from "../../services/auth.service";
import User from "../user/user.model";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  const result = await registerUser(name, email, password);
  return res.status(201).json({ message: "User registered successfully", ...result });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginUser(email, password);
  return res.status(200).json({ message: "Login successful", ...result });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const targetUser = (req as any).user;
  if (!targetUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const fetchedProfile = await User.findById(targetUser._id.toString());
  if (!fetchedProfile) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.status(200).json({ message: "Profile retrieved successfully", data: fetchedProfile });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  return res.status(200).json({ message: "Logged out successfully." });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, role = "user" } = req.body;
  const result = await googleLoginUser(idToken, role);
  return res.status(200).json({ message: "Google OAuth successful.", ...result });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await forgotPasswordService(req.body.email);
  return res.status(200).json({ message: "Password reset link sent to email." });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await resetPasswordService(req.params.token as string, req.body.password);
  return res.status(200).json({ message: "Password successfully reset." });
});

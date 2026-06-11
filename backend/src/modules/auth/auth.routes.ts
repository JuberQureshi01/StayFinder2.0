import { Router } from "express";
import {
  register,
  login,
  getProfile,
  logout,
  googleLogin,
  forgotPassword,
  resetPassword,
} from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { signUpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleLoginSchema } from "../../config/validations";

const router = Router();

// Public Authentication Endpoints (Guarded by Central Zod Higher-Order Middlewares)
router.post("/register", validateRequest(signUpSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.post("/google", validateRequest(googleLoginSchema), googleLogin);
// Protected Identity & Session Endpoints
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);
router.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPassword);
router.put("/reset-password/:token", validateRequest(resetPasswordSchema), resetPassword);

export default router;

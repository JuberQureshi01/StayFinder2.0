import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../modules/user/user.model";
import { asyncHandler } from "./async.middleware";

// Extend Express Request interface locally to natively attach typed User documents
export interface AuthenticatedRequest extends Request {
  user?: any;
}

interface JwtPayload {
  id: string;
  role: string;
}

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication failed. Access token is missing or invalid.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;

    // 3. Optimize DB overhead: Fetch only minimal fields required for authorization checkpoints
    const activeUser = await User.findById(decoded.id).select("_id email role banned profile.verified");
    if (!activeUser) {
      return res.status(401).json({
        message:
          "The user account associated with this session token no longer exists.",
      });
    }
    if (activeUser.banned) {
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
    }
    // console.log(req.user);
    req.user = activeUser;
    next();
  },
);

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Authentication context missing." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Forbidden Access. Your role (${req.user.role}) does not have permission to execute this operation.`,
      });
    }

    // Host-only routes require admin verification
    if (req.user.role === "host" && !req.user.profile?.verified) {
      return res.status(403).json({
        message: "Your host account is pending verification. Please wait for admin approval.",
      });
    }

    next();
  };
};

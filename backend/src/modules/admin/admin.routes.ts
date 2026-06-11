import { Router } from "express";
import {
  getDashboardStats,
  getAllUsers,
  banUser,
  unbanUser,
  getAllListings,
  approveListing,
  rejectListing,
  getAllBookings,
} from "./admin.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../config/validations";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/users", getAllUsers);
router.patch("/users/:id/ban", validateRequest(idParamSchema, "params"), banUser);
router.patch("/users/:id/unban", validateRequest(idParamSchema, "params"), unbanUser);

router.get("/listings", getAllListings);
router.patch("/listings/:id/approve", validateRequest(idParamSchema, "params"), approveListing);
router.patch("/listings/:id/reject", validateRequest(idParamSchema, "params"), rejectListing);

router.get("/bookings", getAllBookings);

export default router;

import { Router } from "express";
import {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
  smartSearchListings,
  generateAIFormDescription,
  getHostListings,
  getBlockedDates,
  toggleBlockDate,
  getAvailability,
  getHostEarnings,
} from "./listing.controller";
import {
  authenticate,
  authorizeRoles,
} from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer";
import { cacheInterceptor } from "../../middlewares/cache.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { searchQueriesSchema, idParamSchema, createListingSchema, blockDateSchema } from "../../config/validations";

const router = Router();

// Create Listing (Protected, Host/Admin only with image upload)
router.post(
  "/create",
  authenticate,
  authorizeRoles("host", "admin"),
  upload.array("images", 10),
  validateRequest(createListingSchema, "body"),
  createListing,
);

// Public Discovery APIs (Protected from load spikes via 5-minute Redis Caching Shield)
router.get(
  "/",
  validateRequest(searchQueriesSchema, "query"),
  cacheInterceptor(300),
  getAllListings,
);

// Public AI-Powered Search Processing Entry Point
router.post("/smart-search", smartSearchListings);

router.get(
  "/analytics/earnings",
  authenticate,
  authorizeRoles("host", "admin"),
  getHostEarnings,
);

router.get(
  "/host",
  authenticate,
  authorizeRoles("host", "admin"),
  getHostListings,
);

router.post("/ai-description", authenticate, generateAIFormDescription);

router.get(
  "/:id",
  validateRequest(idParamSchema, "params"),
  // cacheInterceptor(300),
  getListingById,
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("host", "admin"),
  validateRequest(idParamSchema, "params"),
  upload.array("images", 10),
  updateListing,
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("host", "admin"),
  validateRequest(idParamSchema, "params"),
  deleteListing,
);

// Blocked Dates
router.get(
  "/:id/blocked-dates",
  authenticate,
  validateRequest(idParamSchema, "params"),
  getBlockedDates,
);

router.post(
  "/:id/blocked-dates",
  authenticate,
  authorizeRoles("host", "admin"),
  validateRequest(idParamSchema, "params"),
  validateRequest(blockDateSchema, "body"),
  toggleBlockDate,
);

router.get(
  "/:id/availability",
  getAvailability,
);

export default router;

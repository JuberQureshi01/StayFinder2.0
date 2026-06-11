import { Router } from "express";
import {
  getSimilarListings,
  getForYou,
  getTrending,
  getRecommendationsForListing,
  trackAnalytics,
  updateUserPreferences,
  getUserPreferences,
} from "./recommendation.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/similar/:listingId", getSimilarListings);
router.get("/for-you", authenticate, getForYou);
router.get("/trending", getTrending);
router.get("/listing/:listingId", getRecommendationsForListing);
router.post("/analytics", trackAnalytics);
router.post("/preferences/update", authenticate, updateUserPreferences);
router.get("/preferences", authenticate, getUserPreferences);

export default router;

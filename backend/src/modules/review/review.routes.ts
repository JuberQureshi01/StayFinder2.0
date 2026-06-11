import { Router } from "express";
import { 
  createReview, 
  getListingReviews, 
  getReviewSummary,
  updateReview, 
  deleteReview,
  replyToReview,
} from "./review.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { cacheInterceptor } from "../../middlewares/cache.middleware";
import { createReviewSchema, updateReviewSchema, reviewParamSchema } from "../../config/validations";

const router = Router();

router.get(
  "/listing/:listingId", 
  cacheInterceptor(300), 
  getListingReviews
);

router.get(
  "/listing/:listingId/summary",
  cacheInterceptor(300),
  getReviewSummary,
);

router.use(authenticate);

router.post(
  "/:listingId", 
  validateRequest(createReviewSchema, "body"), 
  createReview
);

router.put(
  "/:id", 
  validateRequest(reviewParamSchema, "params"), 
  validateRequest(updateReviewSchema, "body"), 
  updateReview
);

router.delete(
  "/:id", 
  validateRequest(reviewParamSchema, "params"), 
  deleteReview
);

router.post(
  "/:id/reply",
  validateRequest(reviewParamSchema, "params"),
  replyToReview,
);

export default router;

import { Router } from "express";
import {
  becomeHost,
  getUserProfile,
  getUserWishlist,
  toggleWishlist,
  updateUserProfile,
} from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer";
import { validateRequest } from "../../middlewares/validate.middleware";
import { updateProfileSchema, listingIdParamSchema } from "../../config/validations";

const router = Router();
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, validateRequest(updateProfileSchema, "body"), upload.single("avatar"), updateUserProfile);
router.get("/wishlist", authenticate, getUserWishlist);
router.put("/become-host", authenticate, becomeHost);
router.post("/wishlist/:listingId", authenticate, validateRequest(listingIdParamSchema, "params"), toggleWishlist);

export default router;

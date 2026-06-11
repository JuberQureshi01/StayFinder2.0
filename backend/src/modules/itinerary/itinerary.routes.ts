import { Router } from "express";
import { generateItinerary, getBookingItinerary, updateItinerary, generateListingItinerary, getListingItinerary } from "./itinerary.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { idParamSchema, bookingIdParamSchema, listingIdParamSchema } from "../../config/validations";

const router = Router();

router.use(authenticate);

router.post("/listing/:listingId/generate", validateRequest(listingIdParamSchema, "params"), generateListingItinerary);
router.get("/listing/:listingId", validateRequest(listingIdParamSchema, "params"), getListingItinerary);
router.post("/:bookingId/generate", validateRequest(bookingIdParamSchema, "params"), generateItinerary);
router.get("/:bookingId", validateRequest(bookingIdParamSchema, "params"), getBookingItinerary);
router.put("/:id", validateRequest(idParamSchema, "params"), updateItinerary);

export default router;

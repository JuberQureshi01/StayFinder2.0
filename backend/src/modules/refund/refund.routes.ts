import { Router } from "express";
import { initiateRefund, getRefundStatus, getAllRefunds } from "./refund.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { listingIdParamSchema } from "../../config/validations";

const router = Router();

router.use(authenticate);

router.post("/:bookingId/initiate", validateRequest(listingIdParamSchema, "params"), initiateRefund);
router.get("/:bookingId/status", validateRequest(listingIdParamSchema, "params"), getRefundStatus);
router.get("/", authorizeRoles("admin"), getAllRefunds);

export default router;

import { Router } from "express";
import {
  applyForHost,
  getMyApplication,
  getPendingApplications,
  getAllApplications,
  approveApplication,
  rejectApplication,
} from "./host-application.controller";
import { authenticate, authorizeRoles } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer";
import { validateRequest } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../config/validations";

const router = Router();

router.post("/apply", authenticate, upload.single("idProof"), applyForHost);
router.get("/my-status", authenticate, getMyApplication);
router.get("/pending", authenticate, authorizeRoles("admin"), getPendingApplications);
router.get("/all", authenticate, authorizeRoles("admin"), getAllApplications);
router.patch("/:id/approve", authenticate, authorizeRoles("admin"), validateRequest(idParamSchema, "params"), approveApplication);
router.patch("/:id/reject", authenticate, authorizeRoles("admin"), validateRequest(idParamSchema, "params"), rejectApplication);

export default router;

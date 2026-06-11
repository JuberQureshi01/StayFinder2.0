import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { idParamSchema } from "../../config/validations";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/:id/read", validateRequest(idParamSchema, "params"), markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;

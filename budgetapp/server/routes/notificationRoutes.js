import express from "express";
import {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

router.route("/").get(getNotifications).post(createNotification);
router
  .route("/:id")
  .get(getNotificationById)
  .put(updateNotification)
  .delete(deleteNotification);

export default router;

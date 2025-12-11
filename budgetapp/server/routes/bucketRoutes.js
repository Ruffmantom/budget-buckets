import express from "express";
import {
  getBuckets,
  // getBucketById,
  createBucket,
  updateBucket,
  deleteBucket,
  // getBucketsByBudget,
  clearSubBuckets
} from "../controllers/bucketController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getBuckets).post(protect, createBucket);
// router.get("/budget/:budgetId", protect, getBucketsByBudget);
router
  .route("/:id")
  // .get(protect, getBucketById)
  .put(protect, updateBucket)
  .delete(protect, clearSubBuckets)
  .delete(protect, deleteBucket);

export default router;

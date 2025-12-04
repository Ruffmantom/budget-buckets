import express from "express";
import {
  getBuckets,
  getBucketById,
  createBucket,
  updateBucket,
  deleteBucket,
  getBucketsByBudget
} from "../controllers/bucketController.js";

const router = express.Router();

router.route("/").get(getBuckets).post(createBucket);
router.get("/budget/:budgetId", getBucketsByBudget);
router
  .route("/:id")
  .get(getBucketById)
  .put(updateBucket)
  .delete(deleteBucket);

export default router;

import asyncHandler from "express-async-handler";
import Bucket from "../models/Bucket.js";
import { ApiError } from "../helpers/helpers.js";

// GET /api/buckets
export const getBuckets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.parent_bucket !== undefined) {
    filter.parent_bucket = req.query.parent_bucket || null;
  }

  const buckets = await Bucket.find(filter).lean();
  res.status(200).json(buckets);
});

// GET /api/buckets/budget/:budgetId
export const getBucketsByBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;

  if (!budgetId) {
    return res.status(400).json({ message: "Budget id is required" });
  }

  const [main_buckets, sub_buckets] = await Promise.all([
    Bucket.find({ budget: budgetId, parent_bucket: null }).lean(),
    Bucket.find({ budget: budgetId, parent_bucket: { $ne: null } }).lean()
  ]);

  res.status(200).json({ main_buckets, sub_buckets });
});

// GET /api/buckets/:id
export const getBucketById = asyncHandler(async (req, res) => {
  const bucket = await Bucket.findById(req.params.id).lean();
  if (!bucket) {
    return res.status(404).json({ message: "Bucket not found" });
  }
  res.status(200).json(bucket);
});

// POST /api/buckets
export const createBucket = asyncHandler(async (req, res) => {
  const { title, budget, parent_bucket, amount, is_cash, short_description } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!budget) {
    return res.status(400).json({ message: "Budget is required" });
  }
  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    let bucketPos = 1
    // search all sub buckets for parent
    if (parent_bucket) {
      let foundSubBuckets = await Bucket.find({ parent_bucket: parent_bucket })
      bucketPos = foundSubBuckets ? foundSubBuckets.length + 1 : bucketPos
    }

    const bucket = await Bucket.create({
      title,
      budget,
      parent_bucket,
      amount,
      is_cash,
      short_description,
      position: bucketPos
    });

    return res.status(201).json({
      message: `[Buckets]: Created a bucket ${bucket.title}`,
      bucket: bucket
    });
  } catch (error) {
    throw new ApiError(500, "Failed to create Bucket", error?.message || error);
  }
});

// PUT /api/buckets/:id
export const updateBucket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, budget, parent_bucket, amount, is_cash, short_description, remaining, position } = req.body;
  try {
    const bucket = await Bucket.findById(id);
    if (!bucket) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    if (title !== undefined) bucket.title = title;
    if (budget !== undefined) bucket.budget = budget;
    if (parent_bucket !== undefined) bucket.parent_bucket = parent_bucket;
    if (amount !== undefined) bucket.amount = amount;
    if (remaining !== undefined) bucket.remaining = remaining;
    if (position !== undefined) bucket.position = position;
    if (is_cash !== undefined) bucket.is_cash = is_cash;
    if (short_description !== undefined) bucket.short_description = short_description;

    await bucket.save();

    return res.status(201).json({
      message: `[Buckets]: Updated bucket ${bucket.title}`,
      bucket: bucket
    });
  } catch (error) {
    throw new ApiError(500, "Failed to update bucket", error?.message || error);
  }
});

// DELETE /api/buckets/:id
export const deleteBucket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const bucket = await Bucket.findById(id);
    if (!bucket) {
      return res.status(404).json({ message: "Bucket not found" });
    }

    await bucket.deleteOne();

    return res.status(201).json({
      message: `[Buckets]: Deleted bucket ${bucket.title}`
    });
  } catch (error) {
    throw new ApiError(500, "Failed to delete bucket", error?.message || error);
  }
});

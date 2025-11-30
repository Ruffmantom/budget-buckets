import asyncHandler from "express-async-handler";
import Bucket from "../models/Bucket.js";

// GET /api/buckets
export const getBuckets = asyncHandler(async (req, res) => {
  const buckets = await Bucket.find().lean();
  res.status(200).json(buckets);
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
  const { title, budget, sub_buckets, amount, is_cash, short_description } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!budget) {
    return res.status(400).json({ message: "Budget is required" });
  }
  if (amount === undefined || amount === null) {
    return res.status(400).json({ message: "Amount is required" });
  }

  const bucket = await Bucket.create({
    title,
    budget,
    sub_buckets,
    amount,
    is_cash,
    short_description
  });

  res.status(201).json(bucket);
});

// PUT /api/buckets/:id
export const updateBucket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, budget, sub_buckets, amount, is_cash, short_description } = req.body;

  const bucket = await Bucket.findById(id);
  if (!bucket) {
    return res.status(404).json({ message: "Bucket not found" });
  }

  if (title !== undefined) bucket.title = title;
  if (budget !== undefined) bucket.budget = budget;
  if (sub_buckets !== undefined) bucket.sub_buckets = sub_buckets;
  if (amount !== undefined) bucket.amount = amount;
  if (is_cash !== undefined) bucket.is_cash = is_cash;
  if (short_description !== undefined) bucket.short_description = short_description;

  await bucket.save();

  res.status(200).json(bucket);
});

// DELETE /api/buckets/:id
export const deleteBucket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const bucket = await Bucket.findById(id);
  if (!bucket) {
    return res.status(404).json({ message: "Bucket not found" });
  }

  await bucket.deleteOne();
  res.status(200).json({ message: "Bucket deleted" });
});

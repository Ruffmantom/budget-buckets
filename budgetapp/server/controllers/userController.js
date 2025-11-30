import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -two_factor_secret -two_factor_recovery_codes")
    .lean();
  res.status(200).json(users);
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -two_factor_secret -two_factor_recovery_codes")
    .lean();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json(user);
});

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { email, full_name } = req.body;
  if (!email || !full_name) {
    return res.status(400).json({ message: "Email and full name are required" });
  }

  const user = await User.create(req.body);
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.two_factor_secret;
  delete sanitized.two_factor_recovery_codes;

  res.status(201).json(sanitized);
});

// PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  Object.assign(user, req.body);
  await user.save();

  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.two_factor_secret;
  delete sanitized.two_factor_recovery_codes;

  res.status(200).json(sanitized);
});

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await user.deleteOne();
  res.status(200).json({ message: "User deleted" });
});

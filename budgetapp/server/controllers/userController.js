import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { ApiError } from "../helpers/helpers.js";
// GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -two_factor_secret -two_factor_recovery_codes")
    .lean();
  res.status(200).json(users);
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -two_factor_secret -two_factor_recovery_codes")
      .lean();
    if (!user) throw new ApiError(404, "User not found");
    return res.status(200).json({ message: `[Get User By ID]: Found User for ${user.full_name}`, user });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to fetch user", err?.message || err);
  }
});

// POST /api/users
export const createUser = asyncHandler(async (req, res) => {
  const { email, full_name, password } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ message: "Email and full name are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    // optionally check existing user to return a clear 409
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      full_name,
      password: hashed
    });
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.two_factor_secret;
    delete sanitized.two_factor_recovery_codes;

    return res.status(201).json({
      message: `[Admin]: Created a user for ${sanitized.full_name}`,
      user: sanitized
    });
  } catch (error) {
    throw new ApiError(500, "Failed to create user", error?.message || error);
  }
});

// PUT /api/users/:id
export const updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    Object.assign(user, req.body);
    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.two_factor_secret;
    delete sanitized.two_factor_recovery_codes;

    return res.status(200).json({
      message: `[Update User]: ${user.full_name} has been updated!`,
      sanitized
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to update user", err?.message || err);
  }
});

// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    await user.deleteOne();
    return res.status(200).json({ message: `[Delete User]: ${user.full_name} has been deleted from the DB.` });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to delete user", err?.message || err);
  }
});

export const getUserPlan = asyncHandler(async (req, res) => {
  try {
    return res.status(200).json({ usersPlan: req.plan })
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to get users current plan.", err?.message || err);
  }
});
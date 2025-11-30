import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/User.js";
import Budget from "../models/Budget.js";
import Bucket from "../models/Bucket.js";

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.user_role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

const refreshTtlMs = Number(process.env.REFRESH_TOKEN_TTL_MS) || 30 * 24 * 60 * 60 * 1000; // 30 days

const issueTokens = async (user) => {
  const refreshToken = crypto.randomBytes(40).toString("hex");
  user.refresh_token = refreshToken;
  user.refresh_token_expires = new Date(Date.now() + refreshTtlMs);
  await user.save();
  const token = signToken(user);
  return { token, refreshToken };
};

const isEmailValid = (email = "") => /\S+@\S+\.\S+/.test(email);

export const register = asyncHandler(async (req, res) => {
  const { email, full_name, password, birthday, company, contact, user_status, user_role, about } = req.body;

  if (!email || !full_name || !password) {
    return res.status(400).json({ message: "Email, full name and password are required" });
  }
  if (!isEmailValid(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      email: email.toLowerCase(),
      full_name,
      password: hashed,
      birthday,
      company,
      contact,
      user_status,
      user_role,
      about
    });

    await user.save();

    const budget = await Budget.create({
      creator: user._id,
      connected_users: [user._id]
    });

    const seedBuckets = [
      { title: "Monthly Net Income", short_description: "paychecks & deposits" },
      { title: "Fundamental", short_description: "Bills / rent / food" },
      { title: "Future", short_description: "Savings & goals" },
      { title: "Fun", short_description: "Dining / travel / movie night" }
    ];

    await Bucket.insertMany(
      seedBuckets.map((bucket) => ({
        ...bucket,
        budget: budget._id,
        amount: 0
      }))
    );

    const { token, refreshToken } = await issueTokens(user);

    return res.status(201).json({
      message: "User registered",
      token,
      refresh_token: refreshToken,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name
      },
      budget: {
        id: budget._id
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

export const login = asyncHandler((req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json(info || { message: "Login failed" });

    const proceed = async () => {
      const { token, refreshToken } = await issueTokens(user);
      return res.json({
        message: "Logged in",
        token,
        refresh_token: refreshToken,
        user: {
          id: user._id,
          email: user.email,
          full_name: user.full_name
        }
      });
    };

    proceed().catch(next);
  })(req, res, next);
});

export const googleCallback = asyncHandler((req, res) => {
  const { token, refreshToken } = await issueTokens(req.user);
  res.json({
    message: "Google auth successful",
    token,
    refresh_token: refreshToken,
    user: {
      id: req.user._id,
      email: req.user.email,
      full_name: req.user.full_name
    }
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  const user = await User.findOne({
    refresh_token,
    refresh_token_expires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }

  const { token, refreshToken: newRefresh } = await issueTokens(user);
  res.json({ token, refresh_token: newRefresh });
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  user.refresh_token = null;
  user.refresh_token_expires = null;
  await user.save();
  res.status(200).json({ message: "Logged out" });
});

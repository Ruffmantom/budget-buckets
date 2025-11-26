import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: "Too many login attempts. Please try again later." }
});

const refreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  message: { message: "Too many refresh requests. Please try again later." }
});

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.user_role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
};

// Local Register
router.post("/register", async (req, res) => {
  const { email, full_name, password, birthday, company, contact, user_status, user_role, about } = req.body;

  if (!email || !full_name || !password) {
    return res.status(400).json({ message: "Email, full name and password are required" });
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
    const token = signToken(user);

    return res.status(201).json({
      message: "User registered",
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

// Local Login with rate limiting
router.post("/login", authLimiter, (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json(info || { message: "Login failed" });

    const token = signToken(user);
    return res.json({
      message: "Logged in",
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name
      }
    });
  })(req, res, next);
});

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const token = signToken(req.user);
    res.json({
      message: "Google auth successful",
      token,
      user: {
        id: req.user._id,
        email: req.user.email,
        full_name: req.user.full_name
      }
    });
  }
);

// Token refresh with rate limiting
router.post("/refresh", refreshLimiter, passport.authenticate("jwt", { session: false }), (req, res) => {
  const token = signToken(req.user);
  res.json({ token });
});

export default router;

import express from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  googleCallback,
  refreshToken,
  logout
} from "../controllers/authController.js";

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

// Local Register
router.post("/register",register);

// Local Login with rate limiting
router.post("/login", authLimiter, login);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback
);

// Token refresh with rate limiting
router.post("/refresh", refreshLimiter, refreshToken);

// Logout (clears refresh token)
router.post("/logout", passport.authenticate("jwt", { session: false }), logout);

export default router;

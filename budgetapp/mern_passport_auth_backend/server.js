import express from "express";
import dotenv from "dotenv";
import passport from "passport";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import passportConfig from "./config/passport.js";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Passport config
passportConfig(passport);

// Routes
app.use("/api/auth", authRoutes);

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error(err));

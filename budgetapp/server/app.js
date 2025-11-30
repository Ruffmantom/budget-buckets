// server/app.js
import express from 'express';
import passport from "passport";
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passportConfig from "./config/passport.js";
// Routes
import authRoutes from "./routes/authRoutes.js";
import bucketRoutes from "./routes/bucketRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";

dotenv.config();
const app = express();

// Database connection
// configure the ENV database variable!
// connectDB();

// Middleware
app.use(passport.initialize());
app.use(express.json());                        // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Handle form submissions
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));                         // Logging
app.use(cookieParser());                        // Parse cookies
app.use(helmet());                              // Security headers

// Passport config 
passportConfig(passport);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/bucket", bucketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/budgets", budgetRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running...' });
});

export default app;

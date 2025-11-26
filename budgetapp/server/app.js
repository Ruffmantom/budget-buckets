// server/app.js
import express from 'express';
import passport from "passport";
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passportConfig from "./config/passport.js";

// import connectDB from './config/db.js';           // DB connection
import helloWorldRoutes from './routes/helloWorldRoutes.js';
import authRoutes from "./routes/auth.js";

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
app.use('/api/', helloWorldRoutes);
app.use("/api/auth", authRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API is running...' });
});

export default app;

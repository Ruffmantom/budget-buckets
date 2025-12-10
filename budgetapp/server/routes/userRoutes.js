import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPlan
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { findUserPlan } from "../middleware/helperMiddleware.js";
// keys
const adminRouteKey = process.env.ADMIN_ROUTE_KEY


const router = express.Router();

router.route(`/${adminRouteKey}/`).get(protect, getUsers).post(protect, createUser);
router.route(`/${adminRouteKey}/:id`).get(protect, getUserById).put(protect, updateUser).delete(protect, deleteUser);


router.route('/plan/').get(protect, findUserPlan, getUserPlan)

export default router;
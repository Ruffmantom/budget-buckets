import express from "express";
import {
  getUserBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from "../controllers/budgetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { findUserPlan } from "../middleware/helperMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getUserBudgets).post(protect, findUserPlan, createBudget);
router.route("/:id").get(protect, getBudgetById).put(protect, updateBudget).delete(protect, deleteBudget);

export default router;

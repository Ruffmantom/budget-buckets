import express from "express";
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from "../controllers/budgetController.js";
import { protect } from "../middleware/authMiddleware.js";
import { findUserPlan } from "../middleware/helperMiddleware.js";

const router = express.Router();

router.route("/").get(getBudgets).post(protect, findUserPlan, createBudget);
router.route("/:id").get(getBudgetById).put(updateBudget).delete(deleteBudget);

export default router;

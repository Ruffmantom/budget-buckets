import express from "express";
import {
  getUserExpenses,
  createExpense,
  updateExpense,
  deleteExpense
} from "../controllers/expenseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getUserExpenses).post(protect, createExpense);
router.route("/:id").put(updateExpense).delete(deleteExpense);

export default router;
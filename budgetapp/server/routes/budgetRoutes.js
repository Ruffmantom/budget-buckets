import express from "express";
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
} from "../controllers/budgetController.js";

const router = express.Router();

router.route("/").get(getBudgets).post(createBudget);
router.route("/:id").get(getBudgetById).put(updateBudget).delete(deleteBudget);

export default router;

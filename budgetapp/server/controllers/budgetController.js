import asyncHandler from "express-async-handler";
import Budget from "../models/Budget.js";

// GET /api/budgets
export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find().lean();
  res.status(200).json(budgets);
});

// GET /api/budgets/:id
export const getBudgetById = asyncHandler(async (req, res) => {
  const budget = await Budget.findById(req.params.id).lean();
  if (!budget) {
    return res.status(404).json({ message: "Budget not found" });
  }
  res.status(200).json(budget);
});

// POST /api/budgets
export const createBudget = asyncHandler(async (req, res) => {
  const { creator, connected_users, theme_mode } = req.body;
  if (!creator) {
    return res.status(400).json({ message: "Creator is required" });
  }

  const budget = await Budget.create({ creator, connected_users, theme_mode });
  res.status(201).json(budget);
});

// PUT /api/budgets/:id
export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findById(id);
  if (!budget) {
    return res.status(404).json({ message: "Budget not found" });
  }

  const { creator, connected_users, theme_mode } = req.body;
  if (creator !== undefined) budget.creator = creator;
  if (connected_users !== undefined) budget.connected_users = connected_users;
  if (theme_mode !== undefined) budget.theme_mode = theme_mode;

  await budget.save();
  res.status(200).json(budget);
});

// DELETE /api/budgets/:id
export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findById(id);
  if (!budget) {
    return res.status(404).json({ message: "Budget not found" });
  }

  await budget.deleteOne();
  res.status(200).json({ message: "Budget deleted" });
});


// auth required controllers
export const getUserAssociatedBudgets = asyncHandler(async(req,res)=>{
  // return main current Budget
  // add titles of associated budgets if any
})
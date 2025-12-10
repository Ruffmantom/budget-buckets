import asyncHandler from "express-async-handler";
import Expense from "../models/Expense.js";

// GET /api/expenses
export const getExpenses = asyncHandler(async (req, res) => {
  // find the expenses by the users budget

  const expenses = await Expense.find().lean();
  res.status(200).json(expenses);
});

// GET /api/expenses/:id
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).lean();
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }
  res.status(200).json(expense);
});

// POST /api/expenses
export const createExpense = asyncHandler(async (req, res) => {
  const { user } = req
  const { title, budget, bucket_title, cost, created_at } = req.body;

  if (!title || !bucket_title || !budget) {
    return res.status(400).json({ message: "Title, budget, and bucket are required" });
  }
  if (cost === undefined || cost === null) {
    return res.status(400).json({ message: "Cost is required" });
  }

  const expense = await Expense.create({ title, budget, bucket_title, cost, created_at, user_id: user._id });
  res.status(201).json(expense);
});

// PUT /api/expenses/:id
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  const { title, budget, bucket_title, cost, created_at } = req.body;
  if (title !== undefined) expense.title = title;
  if (budget !== undefined) expense.budget = budget;
  if (bucket_title !== undefined) expense.bucket_title = bucket_title;
  if (cost !== undefined) expense.cost = cost;
  if (created_at !== undefined) expense.created_at = created_at;

  await expense.save();
  res.status(200).json(expense);
});

// DELETE /api/expenses/:id
export const deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const expense = await Expense.findById(id);
  if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
  }

  await expense.deleteOne();
  res.status(200).json({ message: "Expense deleted" });
});

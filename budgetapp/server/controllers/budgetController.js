import asyncHandler from "express-async-handler";
import Budget from "../models/Budget.js";
import { ApiError } from "../helpers/helpers.js";

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
  const { title } = req.body;
  const { user, plan } = req;


  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (!user) {
    return res.status(400).json({ message: "Creator is required" });
  }

  try {
    // check if the plan allows a new budget for the user
    const foundBudgetsForUser = await Budget.find({ creator: user._id })
    // there should always be at least one budget for the user that can not be deleted
    // check it user is at max budgets
    let foundUsersBudgetLength = foundBudgetsForUser.length
    if (foundBudgetsForUser.length === plan.allowedBudgets) {
      return res.status(500).json({ message: "You have reached your max limit of budgets. Please upgrade your plan to access more features." })
    }
    // this should not happen in production unless maybe a user upgraded their account and then downgraded. in that case we will need to add that fix when they downgrade.
    if (foundUsersBudgetLength > plan.allowedBudgets) {
      return res.status(500).json({ message: "You somehow surpassed your max number of allowed budgets for your plan. Please upgrade to gain more features." })
    }


    const budget = await Budget.create({ creator: user._id, title });
    return res.status(201).json(budget);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to create budget", err?.message || err);
  }
});

// PUT /api/budgets/:id
export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await Budget.findById(id);
  if (!budget) {
    return res.status(404).json({ message: "Budget not found" });
  }

  const { creator, linked_users, theme_mode } = req.body;
  if (creator !== undefined) budget.creator = creator;
  if (linked_users !== undefined) budget.linked_users = linked_users;
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
export const getUserAssociatedBudgets = asyncHandler(async (req, res) => {
  // return main current Budget
  // add titles of associated budgets if any
})
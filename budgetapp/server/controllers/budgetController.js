import asyncHandler from "express-async-handler";
import Budget from "../models/Budget.js";
import Bucket from "../models/Bucket.js";
import { ApiError } from "../helpers/helpers.js";
import User from "../models/User.js";

// GET /api/budgets
// for super admin later on past MVP
export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find().lean();
  res.status(200).json(budgets);
});

// GET /api/budgets/:id
// for super admin later on past MVP
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

    // set budget as selected budget for user
    let foundUser = await User.findById(user._id)
    if (!foundUser) {
      return res.status(404).json({ message: "User Not found" })
    }
    // update selected budget
    foundUser.current_selected_budget = budget._id
    // save user
    await foundUser.save()

    return res.status(201).json(budget);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "Failed to create budget", err?.message || err);
  }
});

// PUT /api/budgets/:id
export const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    if (title !== undefined) budget.title = title;

    await budget.save();
    return res.status(200).json(budget);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "There was an error updating your budget. Please contact support.", err?.message || err);
  }
});

// DELETE /api/budgets/:id
export const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const budget = await Budget.findById(id);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }
    if (!budget.can_delete) {
      return res.status(403).json({ message: "Sorry this budget may not be deleted" });
    }

    // delete all the buckets for that budget.
    await Bucket.deleteMany({ budget: budget._id })
    // delete budget
    await budget.deleteOne();

    let foundBudgetsForUser = Budget.find({ creator: user._id }) // returns array
    // set budget as selected budget for user
    let foundUser = await User.findById(user._id)
    if (!foundUser) {
      return res.status(404).json({ message: "User Not found" })
    }
    // update selected budget
    foundUser.current_selected_budget = foundBudgetsForUser[0]?._id
    // save user
    await foundUser.save()

    return res.status(200).json(
      {
        budget: "here", // need to include budget data and buckets to allow frontend to load in newly selected budget after deletion 
        message: "Budget has been deleted"
      });

  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "There was an error deleting your budget. Please contact support.", err?.message || err);
  }
});


// auth required controllers
export const getUserAssociatedBudgets = asyncHandler(async (req, res) => {
  // return main current Budget
  // add titles of associated budgets if any
})
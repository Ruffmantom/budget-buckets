import asyncHandler from "express-async-handler";
import Expense from "../models/Expense.js";
import { ApiError } from "../helpers/helpers.js";

const buildDateRange = (filter) => {
  const now = new Date();
  const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  switch ((filter || "").toLowerCase()) {
    case "this week": {
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - start.getDay()); // start of week (Sunday)
      return { $gte: start, $lte: endOfDay(now) };
    }
    case "last two weeks": {
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - 13); // includes current day + previous 13 days
      return { $gte: start, $lte: endOfDay(now) };
    }
    case "this month": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { $gte: start, $lte: endOfDay(now) };
    }
    case "last month": {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { $gte: start, $lte: end };
    }
    case "all":
    default:
      return null;
  }
};

// GET /api/expenses
// example route with searches
// "/api/expenses?filter=last%20month&search=groceries&page=1&limit=10"
export const getUserExpenses = asyncHandler(async (req, res) => {
  const { user } = req;
  const { search = "", filter = "all", page = 1, limit = 20 } = req.query;

  const currentBudgetId = user.current_selected_budget?._id || user.current_selected_budget?.type || user.current_selected_budget;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const dateRange = buildDateRange(filter);
  const query = {
    budget: currentBudgetId,
    ...(search ? { title: { $regex: search, $options: "i" } } : {}),
    ...(dateRange ? { $or: [{ createdAt: dateRange }, { expense_date: dateRange }] } : {}),
  };

  try {
    const [total, expenses] = await Promise.all([
      Expense.countDocuments(query),
      Expense.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean()
    ]);

    res.status(200).json({
      message: `Found expenses for the current budget.`,
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: pageNum * limitNum < total
      }
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "There was an error finding expenses for this budget. Please contact support.", err?.message || err);
  }
});

// GET /api/expenses/:id
// not needed
// export const getExpenseById = asyncHandler(async (req, res) => {
//   const expense = await Expense.findById(req.params.id).lean();
//   if (!expense) {
//     return res.status(404).json({ message: "Expense not found" });
//   }
//   res.status(200).json(expense);
// });

// POST /api/expenses
export const createExpense = asyncHandler(async (req, res) => {
  const { user } = req
  const { title, budget, bucket, cost, expenseDate } = req.body;
  try {
    if (!title || !bucket || !budget) {
      return res.status(400).json({ message: "Title, budget, and bucket are required" });
    }
    if (cost === undefined || cost === null) {
      return res.status(400).json({ message: "Cost is required" });
    }

    const expense = await Expense.create({
      title,
      budget,
      bucket,
      cost,
      expense_date: expenseDate,
      user_id: user?._id
    });
    res.status(201).json(expense);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "There was an error updating this expense. Please contact support.", err?.message || err);
  }
});

// PUT /api/expenses/:id
export const updateExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const {
      title,
      expenseDate,
      cost,
      bucket
    } = req.body;

    if (title !== undefined) expense.title = title;
    if (expenseDate !== undefined) expense.expense_date = expenseDate;
    if (bucket !== undefined) expense.bucket_title = bucket;
    if (cost !== undefined) expense.cost = cost;

    await expense.save();
    return res.status(200).json(expense);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, "There was an error updating this expense. Please contact support.", err?.message || err);
  }
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

import asyncHandler from "express-async-handler";
import Budget from "../models/Budget.js";
import User from "../models/User.js";
import { ApiError } from "../helpers/helpers.js";
import { budgetPlans } from "../config/plans.js";

export const findUserPlan = asyncHandler(async (req, res, next) => {
    const { user } = req
    try {
        if (!user) {
            return res.status(400).json({ message: "Please authenticate to access this route." });
        }
        let foundUser = await User.findById(user._id)
        let foundPlan = budgetPlans.filter(plan => plan.planTitle.toLowerCase() === foundUser.budget_plan)

        if (!foundPlan) {
            return res.status(400).json({ message: "There was an issue with this request. ID:55467 Please contact support." });
        }
        // move the budget along with the route
        req.plan = foundPlan[0]
        return next()
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(500, "Failed to create budget", err?.message || err);
    }
})
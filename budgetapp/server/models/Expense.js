import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true
    },
    bucket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket",
      required: true
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cost: { type: Number, required: true, default: 0 },
    expense_date: { type: Date },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", ExpenseSchema);

export default Expense;

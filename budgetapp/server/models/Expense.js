import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    budget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true
    },
    bucket_title: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bucket",
      required: true
    },
    created_at: { type: Date, default: Date.now },
    cost: { type: Number, required: true, default: 0 }
  },
  { timestamps: false }
);

const Expense = mongoose.model("Expense", ExpenseSchema);

export default Expense;

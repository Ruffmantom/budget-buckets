import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    title: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    connected_users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },
    can_delete: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Budget = mongoose.model("Budget", BudgetSchema);

export default Budget;

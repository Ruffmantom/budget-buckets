import mongoose from "mongoose";

const BudgetSchema = new mongoose.Schema(
  {
    title: String,
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    connected_users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },
    theme_mode: {
      type: String,
      enum: ["dark", "light", "system"],
      default: "system"
    }
  },
  { timestamps: true }
);

const Budget = mongoose.model("Budget", BudgetSchema);

export default Budget;

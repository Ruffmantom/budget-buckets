import mongoose from "mongoose";

const BucketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", required: true },
    sub_buckets: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bucket" }],
      default: []
    },
    amount: { type: Number, required: true, default: 0 },
    is_cash: { type: Boolean, default: false },
    short_description: { type: String, default: "" }
  },
  { timestamps: true }
);

const Bucket = mongoose.model("Bucket", BucketSchema);

export default Bucket;

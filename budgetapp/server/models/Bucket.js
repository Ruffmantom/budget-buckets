import mongoose from "mongoose";

const BucketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    budget: { type: mongoose.Schema.Types.ObjectId, ref: "Budget", required: true },
    parent_bucket: { type: mongoose.Schema.Types.ObjectId, ref: "Bucket", default: null },
    amount: { type: Number, required: true, default: 0 },
    is_cash: { type: Boolean, default: false },
    short_description: { type: String, default: "" },
    can_delete: { type: Boolean, default: true },
    app_id: { type: String },
    position: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Bucket = mongoose.model("Bucket", BucketSchema);

export default Bucket;

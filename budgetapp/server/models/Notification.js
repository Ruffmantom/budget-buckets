import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "invite"],
      default: "info"
    },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    read_at: { type: Date },
    delivered_at: { type: Date, default: Date.now },
    expires_at: { type: Date }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;

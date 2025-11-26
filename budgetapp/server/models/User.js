import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  full_name: {
    type: String,
    required: true
  },
  birthday: Date,
  company: String,
  contact: String,
  user_status: {
    type: String,
    enum: ["active", "inactive", "banned"],
    default: "active"
  },
  user_role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  about: String,
  password: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

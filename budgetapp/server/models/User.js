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
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  first_name: {
    type: String,
    default:"",
    trim: true
  },
  last_name: {
    type: String,
    default:"",
    trim: true
  },
  user_status: {
    type: String,
    enum: ["pending","active", "inactive", "banned"],
    default: "pending"
  },
  background_color: {
    type: String,
  },
  user_role: {
    type: String,
    enum: ["user", "admin","super_admin"],
    default: "user"
  },
  password: {
    type: String
  },
  refresh_token: {
    type: String
  },
  refresh_token_expires: {
    type: Date
  },
  two_factor_enabled: {
    type: Boolean,
    default: false
  },
  two_factor_secret: {
    type: String
  },
  two_factor_recovery_codes: {
    type: [String],
    default: []
  },
  reset_password_token: {
    type: String
  },
  reset_password_expires: {
    type: Date
  },
  verification_code: {
    type: String
  },
  verification_expires: {
    type: Date
  },
  verified_at: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);

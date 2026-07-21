// server/models/user.model.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    xId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    displayName: { type: String },
    avatar: { type: String },
    totalXP: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
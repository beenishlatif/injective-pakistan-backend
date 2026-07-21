import mongoose from "mongoose";

const guideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true }, // Wallet, Staking, Trading, Basics
    summary: { type: String, required: true },
    content: { type: String, required: true }, // Urdu content, markdown/plain text
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
  
);

export default mongoose.model("Guide", guideSchema);

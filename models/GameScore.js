// server/models/GameScore.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const GameScoreSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // prevents duplicate records per user
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    totalXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    highestScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    wins: {
      type: Number,
      default: 0,
      min: 0,
    },
    losses: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestTime: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Extra safety net alongside the `unique: true` on the field itself
GameScoreSchema.index({ user: 1 }, { unique: true });

const GameScore = mongoose.model("GameScore", GameScoreSchema);

export default GameScore;
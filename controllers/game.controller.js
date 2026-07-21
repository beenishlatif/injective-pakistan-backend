// server/controllers/game.controller.js
import User from "../models/user.model.js";

/**
 * POST /api/game/start
 * Just confirms the session is valid before a run begins.
 * Nothing to persist yet — the real write happens on submit-score.
 */
export async function startGame(req, res) {
  try {
    const user = await User.findById(req.userId).select("username totalXP");
    if (!user) {
      return res.status(404).json({ message: "Player not found." });
    }
    res.json({ message: "Mission started.", profile: user });
  } catch (err) {
    console.error("startGame error:", err.message);
    res.status(500).json({ message: "Failed to start mission." });
  }
}

/**
 * POST /api/game/finish
 * Records the raw outcome of a run (win/loss + time taken).
 * Kept separate from submit-score so you can log every attempt,
 * even ones where the XP submission later fails for some reason.
 */
export async function finishGame(req, res) {
  try {
    const { result, score, timeTaken } = req.body;

    if (!["win", "loss"].includes(result)) {
      return res.status(400).json({ message: "Invalid result value." });
    }

    // Optional: if you keep a separate GameRun/History collection, log it here.
    // await GameRun.create({ user: req.userId, result, score, timeTaken });

    res.json({ message: "Run recorded.", result, score, timeTaken });
  } catch (err) {
    console.error("finishGame error:", err.message);
    res.status(500).json({ message: "Failed to record run." });
  }
}

/**
 * POST /api/game/submit-score
 * The authoritative XP write. Uses $inc so concurrent requests
 * never clobber each other, and always returns the fresh profile
 * so the frontend can show the real updated total immediately.
 */
export async function submitScore(req, res) {
  try {
    const { xpEarned = 0, result } = req.body;

    if (!["win", "loss"].includes(result)) {
      return res.status(400).json({ message: "Invalid result value." });
    }
    if (typeof xpEarned !== "number" || xpEarned < 0) {
      return res.status(400).json({ message: "Invalid XP value." });
    }

    const update = { $inc: { totalXP: xpEarned } };
    update.$inc[result === "win" ? "wins" : "losses"] = 1;

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
    }).select("username avatar totalXP wins losses");

    if (!user) {
      return res.status(404).json({ message: "Player not found." });
    }

    res.json({ message: "Score submitted.", profile: user });
  } catch (err) {
    console.error("submitScore error:", err.message);
    res.status(500).json({ message: "Failed to submit score." });
  }
}

/**
 * GET /api/game/leaderboard
 * Public, top 20 players by totalXP.
 */
export async function getLeaderboard(req, res) {
  try {
    const leaderboard = await User.find()
      .sort({ totalXP: -1 })
      .limit(20)
      .select("username avatar totalXP wins losses");

    res.json({ leaderboard });
  } catch (err) {
    console.error("getLeaderboard error:", err.message);
    res.status(500).json({ message: "Failed to load leaderboard." });
  }
}

/**
 * GET /api/game/profile
 * Returns the logged-in player's own current stats —
 * this is what the frontend calls right after connecting via X.
 */
export async function getPlayerStats(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      "username avatar totalXP wins losses"
    );

    if (!user) {
      return res.status(404).json({ message: "Player not found." });
    }

    res.json({ profile: user });
  } catch (err) {
    console.error("getPlayerStats error:", err.message);
    res.status(500).json({ message: "Failed to load profile." });
  }
}
// server/routes/game.routes.js
import express from "express";
import requireAuth from "../middleware/auth.middleware.js";

import {
  startGame,
  finishGame,
  submitScore,
  getLeaderboard,
  getPlayerStats,
} from "../controllers/game.controller.js";

const router = express.Router();

// Protected: user must have a valid JWT (issued after X OAuth) to play
router.post("/start", requireAuth, startGame);
router.post("/finish", requireAuth, finishGame);
router.post("/submit-score", requireAuth, submitScore);
router.get("/profile", requireAuth, getPlayerStats);

// Public: anyone can view the leaderboard, no login required
router.get("/leaderboard", getLeaderboard);

export default router;
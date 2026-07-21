/**
 * ai.routes.js
 * ------------------------------------------------------------------
 * Mounts the AI assistant endpoints.
 * Requires: npm install express express-rate-limit mongoose
 *
 * Usage in your main server file:
 *   import aiRoutes from './routes/ai.routes.js';
 *   app.use('/api/ai', aiRoutes);
 * ------------------------------------------------------------------
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
  handleChat,
  handleChatStream,
  listSessions,
  getSession,
  deleteSession,
} from "../controllers/ai.controller.js";

const router = express.Router();

// Prevent abuse / runaway API costs — tune as needed.
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please wait a moment before asking again.",
  },
});

router.post("/chat", chatLimiter, handleChat);
router.post("/chat/stream", chatLimiter, handleChatStream);

// Chat history — reading/deleting saved chats.
router.get("/sessions", listSessions);
router.get("/sessions/:sessionId", getSession);
router.delete("/sessions/:sessionId", deleteSession);

export default router;
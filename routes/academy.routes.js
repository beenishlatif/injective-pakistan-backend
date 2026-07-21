/**
 * routes/academy.routes.js
 * ------------------------------------------------------------------
 * Mount this in your main server file:
 *
 *   import academyRoutes from "./routes/academy.routes.js";
 *   app.use("/api/academy", academyRoutes);
 *
 * Resulting endpoints:
 *   GET  /api/academy/tracks
 *   GET  /api/academy/stats
 *   GET  /api/academy/enrollments
 *   POST /api/academy/enroll
 * ------------------------------------------------------------------
 */

import express from "express";
import {
  getTracks,
  getStats,
  getEnrollments,
  enrollLearner,
} from "../controllers/academy.controller.js";

const router = express.Router();

router.get("/tracks", getTracks);
router.get("/stats", getStats);
router.get("/enrollments", getEnrollments);
router.post("/enroll", enrollLearner);

export default router;
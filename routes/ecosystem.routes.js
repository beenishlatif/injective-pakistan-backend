/**
 * ecosystem.routes.js  (ESM version)
 * ------------------------------------------------------------------
 * REST routes for the Ecosystem directory. Mount this in your main
 * server file, e.g.:
 *
 *   import ecosystemRoutes from "./routes/ecosystem.routes.js";
 *   app.use("/api/ecosystem", ecosystemRoutes);
 *
 * NOTE: createProject is intentionally public (project submissions).
 * updateProject / deleteProject should be locked down with your own
 * auth/admin middleware before going to production — see the
 * commented-out example below.
 *
 * Use this version if your project's package.json has "type": "module".
 * ------------------------------------------------------------------
 */

import express from "express";

import {
  getProjects,
  getFeaturedProjects,
  getProjectByIdOrSlug,
  getStats,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/ecosystem.controller.js";

const router = express.Router();

// Example admin guard — plug in your real auth middleware:
// import { requireAdmin } from "../middleware/auth.js";

// ---- Read ----
router.get("/projects", getProjects);
router.get("/projects/featured", getFeaturedProjects);
router.get("/projects/:idOrSlug", getProjectByIdOrSlug);
router.get("/stats", getStats);

// ---- Write ----
router.post("/projects", createProject); // public: project submission form
router.patch("/projects/:id", /* requireAdmin, */ updateProject);
router.delete("/projects/:id", /* requireAdmin, */ deleteProject);

export default router;
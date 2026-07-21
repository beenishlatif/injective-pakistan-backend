/**
 * routes/community.routes.js
 * ------------------------------------------------------------------
 * Mount this in server.js alongside your other route imports:
 *
 *   import communityRoutes from "./routes/community.routes.js";
 *   app.use("/api/community", communityRoutes);
 *
 * The commented-out `requireAdmin` calls mark endpoints that should
 * be protected by whatever auth middleware you already use elsewhere
 * in the project (see auth.routes.js) — plug it in the same way.
 * ------------------------------------------------------------------
 */

import express from "express";
import {
  getMembers,
  getFeaturedMembers,
  getStats,
  joinCommunity,
  getEvents,
  createEvent,
  approveMember,
  approveMemberByLink,
  rejectMemberByLink,
} from "../controllers/community.controller.js";
// import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public: directory + featured members
router.get("/members", getMembers);
router.get("/members/featured", getFeaturedMembers);

// Public but token-protected: the Accept / Reject buttons in the
// join-request email hit these directly (plain GET links).
router.get("/members/:id/approve", approveMemberByLink);
router.get("/members/:id/reject", rejectMemberByLink);

// Admin: approve a pending join request from a dashboard (optionally mark as featured)
router.patch("/members/:id/approve", /* requireAdmin, */ approveMember);

// Public: hero stat row
router.get("/stats", getStats);

// Public: "Join the community" form on the Hub page
router.post("/join", joinCommunity);

// Public: upcoming events list
router.get("/events", getEvents);

// Admin: create an event
router.post("/events", /* requireAdmin, */ createEvent);

export default router;
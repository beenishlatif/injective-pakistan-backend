/**
 * models/Enrollment.model.js
 * ------------------------------------------------------------------
 * One learner's enrollment into a track. A learner can enroll into
 * multiple tracks over time (one document per email+trackSlug pair);
 * `completed` + `completedAt` back the "Certificates Issued" stat and
 * the on-chain certificate flow described on the Academy page.
 *
 * NOTE: this file was previously saved as models/Enrollment.js while
 * every controller/seed script imported "../models/Enrollment.model.js".
 * That filename mismatch is why enrollment (and every other Academy
 * route touching this model) was failing on the server — Node couldn't
 * resolve the import, so the route handler threw before it ever reached
 * the database. Keep this filename in sync with the imports.
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    trackSlug: { type: String, required: true, trim: true, lowercase: true },

    // Wallet address the on-chain certificate will be minted to, if/when
    // the learner connects one. Optional at enrollment time.
    walletAddress: { type: String, trim: true, default: null },

    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },

    // Free-text source of the signup, useful for measuring which page/CTA
    // drove the enrollment (e.g. "academy-hero", "academy-track-card").
    source: { type: String, trim: true, default: "academy-page" },
  },
  { timestamps: { createdAt: "enrolledAt", updatedAt: true } }
);

// One active enrollment per learner per track.
EnrollmentSchema.index({ email: 1, trackSlug: 1 }, { unique: true });
// Recent-enrollments listing (used by GET /api/academy/enrollments) is
// sorted newest-first, so index that access pattern too.
EnrollmentSchema.index({ enrolledAt: -1 });

export default mongoose.model("Enrollment", EnrollmentSchema);
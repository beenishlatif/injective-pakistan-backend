/**
 * models/AcademyTrack.model.js
 * ------------------------------------------------------------------
 * A single track in the Academy learning path (e.g. "Foundations",
 * "Trader Track"). Tracks are ordered via `step`, and each one owns an
 * embedded list of modules — modules never need to be queried on their
 * own, so they're embedded rather than a separate collection.
 *
 * NOTE: this file was previously saved as models/AcademyTrack.js while
 * every controller/seed script imported "../models/AcademyTrack.model.js".
 * Keep this filename in sync with those imports — see the matching note
 * in Enrollment.model.js for why that mismatch breaks every route.
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

const ModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    minutes: { type: Number, required: true, min: 1 },
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const AcademyTrackSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    step: { type: Number, required: true, min: 1 },
    level: { type: String, required: true, trim: true }, // e.g. "Foundations", "Trader Track"
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    durationHours: { type: Number, required: true, min: 0 },
    modules: {
      type: [ModuleSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "A track must have at least one module.",
      },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

AcademyTrackSchema.index({ step: 1 });

// Convenience virtual: total minutes across all modules in the track.
AcademyTrackSchema.virtual("totalMinutes").get(function () {
  return this.modules.reduce((sum, m) => sum + m.minutes, 0);
});

AcademyTrackSchema.set("toJSON", { virtuals: true });

export default mongoose.model("AcademyTrack", AcademyTrackSchema);
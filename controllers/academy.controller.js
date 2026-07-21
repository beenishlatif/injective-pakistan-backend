/**
 * controllers/academy.controller.js
 * ------------------------------------------------------------------
 * Handlers backing Academy.jsx:
 *   getTracks       -> GET  /api/academy/tracks
 *   getStats        -> GET  /api/academy/stats
 *   getEnrollments  -> GET  /api/academy/enrollments
 *   enrollLearner   -> POST /api/academy/enroll
 *
 * Every handler responds with { success: boolean, ... } so the frontend
 * can branch on `data.success` the same way it already does for the
 * Home page endpoints.
 *
 * NOTE: this file was previously saved as controllers/academyController.js
 * while routes/academy.routes.js imported "../controllers/academy.controller.js".
 * Node resolved that import to a file that didn't exist, so every request
 * to /api/academy/* (including enroll) died before this code ever ran —
 * that's the reason "Enroll for free" always showed the generic error.
 * Keep this filename in sync with the import in academy.routes.js.
 * ------------------------------------------------------------------
 */

import AcademyTrack from "../models/AcademyTrack.model.js";
import Enrollment from "../models/Enrollment.model.js";

// Average days between enrollment and completion, across every learner
// who has finished at least one track. Falls back to null (not 0) when
// nobody has completed anything yet, so the frontend can render "—".
async function computeAvgCompletionDays() {
  const result = await Enrollment.aggregate([
    { $match: { completed: true, completedAt: { $ne: null } } },
    {
      $project: {
        days: {
          $divide: [{ $subtract: ["$completedAt", "$enrolledAt"] }, 1000 * 60 * 60 * 24],
        },
      },
    },
    { $group: { _id: null, avgDays: { $avg: "$days" } } },
  ]);

  if (!result.length) return null;
  return Math.round(result[0].avgDays * 10) / 10;
}

// Masks an email for public display: "beenish@example.com" -> "be••••@example.com"
function maskEmail(email = "") {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "••••";
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(user.length - 2, 3))}@${domain}`;
}

// GET /api/academy/tracks
// Returns published tracks in curriculum order (by `step`).
export const getTracks = async (req, res) => {
  try {
    const tracks = await AcademyTrack.find({ isPublished: true })
      .sort({ step: 1 })
      .lean();

    return res.status(200).json({ success: true, tracks });
  } catch (err) {
    console.error("getTracks error:", err);
    return res.status(500).json({ success: false, message: "Failed to load tracks." });
  }
};

// GET /api/academy/stats
// Live snapshot for the stats strip at the top of the Academy page.
export const getStats = async (req, res) => {
  try {
    const [learnersEnrolled, certificatesIssued, tracksLive, avgCompletionDays] =
      await Promise.all([
        Enrollment.countDocuments({}),
        Enrollment.countDocuments({ completed: true }),
        AcademyTrack.countDocuments({ isPublished: true }),
        computeAvgCompletionDays(),
      ]);

    return res.status(200).json({
      success: true,
      stats: { learnersEnrolled, certificatesIssued, tracksLive, avgCompletionDays },
    });
  } catch (err) {
    console.error("getStats error:", err);
    return res.status(500).json({ success: false, message: "Failed to load academy stats." });
  }
};

// GET /api/academy/enrollments?limit=20
// Public, privacy-safe list of learners for the "Who's Learning" table.
// Emails are masked server-side — the page never receives full addresses.
export const getEnrollments = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const [enrollments, tracks] = await Promise.all([
      Enrollment.find({})
        .sort({ enrolledAt: -1 })
        .limit(limit)
        .select("name email trackSlug completed completedAt enrolledAt")
        .lean(),
      AcademyTrack.find({}).select("slug level title").lean(),
    ]);

    const trackBySlug = Object.fromEntries(tracks.map((t) => [t.slug, t]));

    const learners = enrollments.map((e) => ({
      name: e.name,
      email: maskEmail(e.email),
      trackSlug: e.trackSlug,
      trackLabel: trackBySlug[e.trackSlug]?.level || e.trackSlug,
      trackTitle: trackBySlug[e.trackSlug]?.title || null,
      completed: e.completed,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
    }));

    return res.status(200).json({ success: true, learners, total: learners.length });
  } catch (err) {
    console.error("getEnrollments error:", err);
    return res.status(500).json({ success: false, message: "Failed to load enrolled learners." });
  }
};

// POST /api/academy/enroll
// Body: { name, email, trackSlug, source? }
export const enrollLearner = async (req, res) => {
  try {
    const { name, email, trackSlug, source } = req.body || {};

    if (!name?.trim() || !email?.trim() || !trackSlug?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and trackSlug are required." });
    }

    const track = await AcademyTrack.findOne({ slug: trackSlug.trim().toLowerCase() });
    if (!track) {
      return res.status(404).json({ success: false, message: "That track does not exist." });
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { email: email.trim().toLowerCase(), trackSlug: track.slug },
      {
        $setOnInsert: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          trackSlug: track.slug,
          source: source?.trim() || "academy-page",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, enrollment });
  } catch (err) {
    // Duplicate key = already enrolled in this track; treat as a friendly success.
    if (err?.code === 11000) {
      return res.status(200).json({ success: true, message: "Already enrolled." });
    }
    console.error("enrollLearner error:", err);
    return res.status(500).json({ success: false, message: "Failed to enroll. Try again." });
  }
};
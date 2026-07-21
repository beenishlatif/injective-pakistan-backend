/**
 * controllers/community.controller.js
 * ------------------------------------------------------------------
 * Request handlers backing the Injective Pakistan Community Hub page.
 * Every handler returns { success: boolean, ... } so the frontend can
 * branch on `data.success` the same way the rest of the app does.
 * ------------------------------------------------------------------
 */

import { CommunityMember, CommunityEvent } from "../models/community.model.js";
import {
  sendJoinRequestEmail,
  verifyActionToken,
  actionResultPage,
} from "../utils/community.mailer.js";

// GET /api/community/members
// All approved members (used for a full directory view, if you add one).
export async function getMembers(req, res) {
  try {
    const members = await CommunityMember.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .select("-email"); // don't leak emails to a public listing
    res.json({ success: true, members });
  } catch (err) {
    console.error("getMembers error:", err);
    res.status(500).json({ success: false, error: "Could not load community members." });
  }
}

// GET /api/community/members/featured
// Ambassadors / core team shown on the Hub page itself.
export async function getFeaturedMembers(req, res) {
  try {
    const members = await CommunityMember.find({ status: "approved", featured: true })
      .sort({ role: 1, createdAt: -1 })
      .select("-email")
      .limit(12);
    res.json({ success: true, members });
  } catch (err) {
    console.error("getFeaturedMembers error:", err);
    res.status(500).json({ success: false, error: "Could not load featured members." });
  }
}

// GET /api/community/stats
// Powers the stat row in the hero section.
export async function getStats(req, res) {
  try {
    const [members, cities, events] = await Promise.all([
      CommunityMember.countDocuments({ status: "approved" }),
      CommunityMember.distinct("city", { status: "approved" }),
      CommunityEvent.countDocuments({}),
    ]);
    res.json({
      success: true,
      stats: {
        members,
        cities: cities.filter(Boolean).length,
        events,
      },
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ success: false, error: "Could not load community stats." });
  }
}

// POST /api/community/join
// Public "Join the community" form submission -> lands as pending.
export async function joinCommunity(req, res) {
  try {
    const { name, email, city, telegramHandle, twitterHandle, bio } = req.body;

    if (!name || !name.trim() || !email || !email.trim()) {
      return res.status(400).json({ success: false, error: "Name and email are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await CommunityMember.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "This email has already requested to join the community.",
      });
    }

    const member = await CommunityMember.create({
      name: name.trim(),
      email: normalizedEmail,
      city: city?.trim(),
      telegramHandle: telegramHandle?.trim(),
      twitterHandle: twitterHandle?.trim(),
      bio: bio?.trim(),
    });

    // Notify the community admin by email with Accept / Reject links.
    // A failed email should never fail the user's join request, so
    // this is fire-and-forget with its own error handling.
    sendJoinRequestEmail(member).catch((err) => {
      console.error("Failed to send join-request email:", err);
    });

    res.status(201).json({
      success: true,
      member: { id: member._id, name: member.name, status: member.status },
    });
  } catch (err) {
    console.error("joinCommunity error:", err);
    res.status(500).json({ success: false, error: "Could not submit your request. Please try again." });
  }
}

// GET /api/community/events
// Upcoming events only, soonest first.
export async function getEvents(req, res) {
  try {
    const events = await CommunityEvent.find({ date: { $gte: new Date() } }).sort({ date: 1 });
    res.json({ success: true, events });
  } catch (err) {
    console.error("getEvents error:", err);
    res.status(500).json({ success: false, error: "Could not load events." });
  }
}

// POST /api/community/events  (admin-only — wire up your own auth middleware in routes.js)
export async function createEvent(req, res) {
  try {
    const { title, description, city, venue, date, link, coverImageUrl } = req.body;
    if (!title || !title.trim() || !date) {
      return res.status(400).json({ success: false, error: "Title and date are required." });
    }
    const event = await CommunityEvent.create({
      title: title.trim(),
      description: description?.trim(),
      city: city?.trim(),
      venue: venue?.trim(),
      date,
      link: link?.trim(),
      coverImageUrl: coverImageUrl?.trim(),
    });
    res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("createEvent error:", err);
    res.status(500).json({ success: false, error: "Could not create event." });
  }
}

// GET /api/community/members/:id/approve?token=...
// Hit when the admin clicks "Accept" in the join-request email.
export async function approveMemberByLink(req, res) {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!verifyActionToken(id, "approve", token)) {
      return res.status(403).send(actionResultPage("error", "This link is invalid or has expired."));
    }

    const member = await CommunityMember.findByIdAndUpdate(
      id,
      { status: "approved" },
      { new: true }
    );
    if (!member) {
      return res.status(404).send(actionResultPage("error", "This member no longer exists."));
    }

    res.send(
      actionResultPage("success", `${member.name} has been accepted into the community.`)
    );
  } catch (err) {
    console.error("approveMemberByLink error:", err);
    res.status(500).send(actionResultPage("error", "Something went wrong. Please try again."));
  }
}

// GET /api/community/members/:id/reject?token=...
// Hit when the admin clicks "Reject" in the join-request email.
export async function rejectMemberByLink(req, res) {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!verifyActionToken(id, "reject", token)) {
      return res.status(403).send(actionResultPage("error", "This link is invalid or has expired."));
    }

    const member = await CommunityMember.findByIdAndUpdate(
      id,
      { status: "rejected" },
      { new: true }
    );
    if (!member) {
      return res.status(404).send(actionResultPage("error", "This member no longer exists."));
    }

    res.send(actionResultPage("success", `${member.name}'s request has been rejected.`));
  } catch (err) {
    console.error("rejectMemberByLink error:", err);
    res.status(500).send(actionResultPage("error", "Something went wrong. Please try again."));
  }
}

// PATCH /api/community/members/:id/approve  (admin-only)
export async function approveMember(req, res) {
  try {
    const { featured } = req.body || {};
    const member = await CommunityMember.findByIdAndUpdate(
      req.params.id,
      { status: "approved", ...(typeof featured === "boolean" ? { featured } : {}) },
      { new: true }
    );
    if (!member) {
      return res.status(404).json({ success: false, error: "Member not found." });
    }
    res.json({ success: true, member });
  } catch (err) {
    console.error("approveMember error:", err);
    res.status(500).json({ success: false, error: "Could not approve member." });
  }
}
/**
 * models/community.model.js
 * ------------------------------------------------------------------
 * Mongoose models for the Injective Pakistan "Community Hub" module.
 *
 *  - CommunityMember: people who submit the "Join the community" form
 *    on the Hub page. New submissions land as status:"pending"; an
 *    admin flips them to "approved" (and optionally "featured") so
 *    they show up publicly on the page.
 *  - CommunityEvent: meetups / AMAs / workshops shown in the
 *    "Upcoming events" section of the Hub page.
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

const CommunityMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    city: { type: String, trim: true, maxlength: 60 },
    telegramHandle: { type: String, trim: true, maxlength: 60 },
    twitterHandle: { type: String, trim: true, maxlength: 60 },
    bio: { type: String, trim: true, maxlength: 400 },
    role: {
      type: String,
      enum: ["Member", "Contributor", "Ambassador", "Core Team"],
      default: "Member",
    },
    avatarUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Featured members are shown in the highlighted grid on the Hub page.
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CommunityEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600 },
    city: { type: String, trim: true, maxlength: 60 },
    venue: { type: String, trim: true, maxlength: 120 },
    date: { type: Date, required: true },
    link: { type: String, trim: true }, // registration / RSVP link
    coverImageUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

// Guard against model overwrite errors when this file is imported
// more than once (common with hot-reload in dev).
export const CommunityMember =
  mongoose.models.CommunityMember ||
  mongoose.model("CommunityMember", CommunityMemberSchema);

export const CommunityEvent =
  mongoose.models.CommunityEvent ||
  mongoose.model("CommunityEvent", CommunityEventSchema);
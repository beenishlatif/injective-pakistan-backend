/**
 * EcosystemProject.js  (ESM version)
 * ------------------------------------------------------------------
 * Mongoose model for a project listed in the Injective Ecosystem
 * directory (Ecosystem.jsx). Each document represents one dApp /
 * protocol / tool built on Injective.
 *
 * Use this version if your project's package.json has "type": "module".
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

// NOTE: This list must stay in sync with:
//   - seedEcosystem.js (sample data categories)
//   - Ecosystem.jsx CATEGORIES (frontend filter chips)
const CATEGORIES = [
  "DEX",
  "Lending",
  "Staking",
  "RWA",
  "AI",
  "NFT",
  "Gaming",
  "Infrastructure",
  "Wallet",
  "DAO",
  "Other",
];

const ecosystemProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "A short description is required"],
      trim: true,
      maxlength: 280,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
      index: true,
    },
    website: {
      type: String,
      required: [true, "Website URL is required"],
      trim: true,
    },
    twitter: {
      type: String,
      trim: true,
      default: "",
    },
    tvl: {
      // Total value locked in USD, optional — only meaningful for DeFi projects
      type: Number,
      min: 0,
      default: null,
    },
    chain: {
      type: String,
      trim: true,
      default: "Injective",
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedBy: {
      type: String, // email or wallet address of submitter, optional
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Text index to support the search bar in Ecosystem.jsx
ecosystemProjectSchema.index({ name: "text", description: "text" });

// Auto-generate a URL-safe slug from the name if one wasn't provided
ecosystemProjectSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

ecosystemProjectSchema.statics.CATEGORIES = CATEGORIES;

const EcosystemProject = mongoose.model("EcosystemProject", ecosystemProjectSchema);

export default EcosystemProject;
/**
 * StatsSnapshot.js
 * ------------------------------------------------------------------
 * Caches the latest live-network stats shown on the home page
 * (INJ price, total staked, total burned, Helix 24h volume).
 *
 * We cache rather than hitting CoinGecko / Injective endpoints on
 * every page load, since those upstream APIs are rate-limited on
 * free tiers. homeController refreshes this on a TTL (see
 * STATS_CACHE_TTL_MS in homeController.js).
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

const statsSnapshotSchema = new mongoose.Schema(
  {
    injPriceUsd: { type: Number, default: null },
    injPriceChange24h: { type: Number, default: null }, // percentage
    totalStakedInj: { type: Number, default: null },
    totalStakedUsd: { type: Number, default: null },
    totalBurnedInj: { type: Number, default: null },
    helixVolume24hUsd: { type: Number, default: null },
    source: {
      type: String,
      enum: ["live", "fallback"],
      default: "live",
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Only the most recent snapshot is ever needed.
statsSnapshotSchema.index({ fetchedAt: -1 });

const StatsSnapshot = mongoose.model(
  "StatsSnapshot",
  statsSnapshotSchema
);

export default StatsSnapshot;
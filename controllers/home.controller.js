/**
 * homeController.js
 * ------------------------------------------------------------------
 * Controllers backing the home page:
 *
 *   GET /api/home/stats              -> live-ish network stats, cached
 *   GET /api/home/ecosystem-featured -> featured ecosystem protocols
 *
 * Stats strategy
 * ------------------------------------------------------------------
 * CoinGecko's free tier is rate-limited (~10-30 req/min shared across
 * all your users), so we never call it directly from a page load.
 * Instead:
 *   1. A request checks StatsSnapshot for the most recent document.
 *   2. If it's younger than STATS_CACHE_TTL_MS, return it as-is.
 *   3. Otherwise refresh it from upstream sources and save a new
 *      snapshot, then return that.
 *   4. If the upstream refresh fails, fall back to the last good
 *      snapshot (however old) rather than showing nothing.
 *
 * INJ price + 24h change come from CoinGecko's public simple-price
 * endpoint (no API key required for low volume use).
 *
 * Total staked comes from the Injective LCD staking pool endpoint.
 * Total burned is currently a static, periodically-updated figure
 * (see services/injective.service.js -> getBurnedInj for why).
 * Helix 24h volume comes from DefiLlama's dex summary endpoint.
 * ------------------------------------------------------------------
 */

import axios from "axios";
import StatsSnapshot from "../models/StatsSnapshot.model.js";
import EcosystemProject from "../models/Ecosystem.model.js";
import {
  getStakedInj,
  getSupplyInfo,
  getBurnedInj,
} from "../services/injective.service.js"; // <-- adjust path if needed
import { getHelixVolume24h } from "../services/helix.service.js"; // <-- adjust path if needed

const STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd&include_24hr_change=true";

// ------------------------------------------------------------------
// GET /api/home/stats
// ------------------------------------------------------------------
export async function getLiveStats(req, res) {
  try {
    const latest = await StatsSnapshot.findOne()
      .sort({ fetchedAt: -1 })
      .lean();

    const isFresh =
      latest &&
      Date.now() - new Date(latest.fetchedAt).getTime() 
        STATS_CACHE_TTL_MS;

    if (isFresh) {
      return res.json({
        success: true,
        stats: toStatsPayload(latest),
        cached: true,
      });
    }

    const refreshed = await refreshStatsSnapshot();

    return res.json({
      success: true,
      stats: toStatsPayload(refreshed),
      cached: false,
    });
  } catch (err) {
    console.error("getLiveStats error:", err.message);

    try {
      const fallback = await StatsSnapshot.findOne()
        .sort({ fetchedAt: -1 })
        .lean();

      if (fallback) {
        return res.json({
          success: true,
          stats: toStatsPayload(fallback),
          cached: true,
          stale: true,
        });
      }
    } catch (innerErr) {
      console.error(
        "getLiveStats fallback lookup failed:",
        innerErr.message
      );
    }

    return res.status(502).json({
      success: false,
      error: "Unable to load live stats right now.",
    });
  }
}

async function refreshStatsSnapshot() {
  const [priceData, onChainData] = await Promise.all([
    fetchCoinGeckoPrice(),
    fetchOnChainStats(),
  ]);

  const snapshot = await StatsSnapshot.create({
    injPriceUsd: priceData.injPriceUsd,
    injPriceChange24h: priceData.injPriceChange24h,
    totalStakedInj: onChainData.totalStakedInj,
    totalStakedUsd:
      onChainData.totalStakedInj != null &&
      priceData.injPriceUsd != null
        ? onChainData.totalStakedInj * priceData.injPriceUsd
        : null,
    totalBurnedInj: onChainData.totalBurnedInj,
    helixVolume24hUsd: onChainData.helixVolume24hUsd,
    source: "live",
    fetchedAt: new Date(),
  });

  return snapshot.toObject();
}

async function fetchCoinGeckoPrice() {
  try {
    const { data } = await axios.get(COINGECKO_URL, {
      timeout: 8000,
    });

    const inj = data?.["injective-protocol"];

    return {
      injPriceUsd: typeof inj?.usd === "number" ? inj.usd : null,
      injPriceChange24h:
        typeof inj?.usd_24h_change === "number"
          ? inj.usd_24h_change
          : null,
    };
  } catch (err) {
    // Logs status/body too, so you can see the real reason (rate limit,
    // network, timeout, etc.) instead of just "failed".
    console.error(
      "fetchCoinGeckoPrice failed:",
      err.response?.status,
      err.response?.data || err.message
    );

    return {
      injPriceUsd: null,
      injPriceChange24h: null,
    };
  }
}

// ------------------------------------------------------------------
// Previously this was a stub that always returned nulls (comment said
// "Add your Injective APIs here" but never called anything). Now wired
// up to the real services.
// ------------------------------------------------------------------
async function fetchOnChainStats() {
  const [stakedResult, volumeResult, burnedResult] = await Promise.allSettled([
    getStakedInj(),
    getHelixVolume24h(),
    getBurnedInj(),
  ]);

  const totalStakedInj =
    stakedResult.status === "fulfilled"
      ? stakedResult.value?.staked ?? null
      : null;

  const helixVolume24hUsd =
    volumeResult.status === "fulfilled"
      ? volumeResult.value?.volume24h ?? null
      : null;

  const totalBurnedInj =
    burnedResult.status === "fulfilled"
      ? burnedResult.value?.burned ?? null
      : null;

  if (stakedResult.status === "rejected") {
    console.error("getStakedInj failed:", stakedResult.reason?.message);
  }
  if (volumeResult.status === "rejected") {
    console.error("getHelixVolume24h failed:", volumeResult.reason?.message);
  }
  if (burnedResult.status === "rejected") {
    console.error("getBurnedInj failed:", burnedResult.reason?.message);
  }

  return {
    totalStakedInj,
    totalBurnedInj,
    helixVolume24hUsd,
  };
}

function toStatsPayload(snapshot) {
  return {
    injPriceUsd: snapshot.injPriceUsd ?? null,
    injPriceChange24h: snapshot.injPriceChange24h ?? null,
    totalStakedInj: snapshot.totalStakedInj ?? null,
    totalStakedUsd: snapshot.totalStakedUsd ?? null,
    totalBurnedInj: snapshot.totalBurnedInj ?? null,
    helixVolume24hUsd: snapshot.helixVolume24hUsd ?? null,
    fetchedAt: snapshot.fetchedAt,
  };
}

// ------------------------------------------------------------------
// GET /api/home/ecosystem-featured
// ------------------------------------------------------------------
export async function getFeaturedEcosystem(req, res) {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 4,
      12
    );

    let projects = await EcosystemProject.find({
      isFeatured: true,
      isActive: true,
    })
      .sort({
        displayOrder: 1,
        createdAt: 1,
      })
      .limit(limit)
      .select(
        "name slug category description descriptionUrdu logoUrl websiteUrl tvlUsd"
      )
      .lean();

    if (projects.length === 0) {
      projects = await EcosystemProject.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select(
          "name slug category description descriptionUrdu logoUrl websiteUrl tvlUsd"
        )
        .lean();
    }

    return res.json({
      success: true,
      projects,
    });
  } catch (err) {
    console.error(
      "getFeaturedEcosystem error:",
      err.message
    );

    return res.status(500).json({
      success: false,
      error: "Unable to load ecosystem highlights.",
    });
  }
}
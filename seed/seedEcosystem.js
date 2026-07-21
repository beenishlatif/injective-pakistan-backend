/**
 * seedEcosystem.js  (ESM)
 * ------------------------------------------------------------------
 * One-off script to populate the EcosystemProject collection with
 * sample data so the Ecosystem.jsx page has something to show while
 * you build out the real submission/approval flow.
 *
 * Usage:
 *   1. Place this file anywhere in your backend, e.g. server/seed/seedEcosystem.js
 *   2. Make sure MONGODB_URI is set in your .env (same one your server uses)
 *   3. Run:  node server/seed/seedEcosystem.js
 *
 * This clears existing sample data with the same slugs and re-inserts,
 * so it's safe to run more than once.
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import EcosystemProject from "../models/Ecosystem.model.js"; // adjust path if needed

// Fix for "querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net" on some
// Windows machines where the OS/network default DNS resolver fails to
// resolve SRV records. Forcing Node to use Google's public DNS for lookups
// sidesteps flaky ISP/router/VPN DNS servers. This only affects this
// process's DNS resolution, not your system-wide settings.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Resolve .env relative to THIS file's location (server/.env), not the
// terminal's current working directory — avoids "ECONNREFUSED 127.0.0.1"
// caused by dotenv silently failing to find the file.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const sampleProjects = [
  {
    name: "Helix",
    slug: "helix",
    description: "Fully decentralized spot and derivatives exchange built on Injective's on-chain order book.",
    category: "DEX",
    website: "https://helixapp.com",
    twitter: "https://twitter.com/helix_app",
    tvl: 42_000_000,
    featured: true,
    status: "approved",
  },
  {
    name: "Mito",
    slug: "mito",
    description: "Automated on-chain vaults and structured products for yield strategies on Injective.",
    category: "RWA",
    website: "https://mito.fi",
    twitter: "https://twitter.com/mitofinance",
    tvl: 8_500_000,
    featured: true,
    status: "approved",
  },
  {
    name: "Black Panther",
    slug: "black-panther",
    description: "Play-to-earn strategy game built natively on the Injective chain.",
    category: "Gaming",
    website: "https://blackpanther.finance",
    featured: true,
    status: "approved",
  },
  {
    name: "Hydro Protocol",
    slug: "hydro-protocol",
    description: "Liquid staking protocol letting INJ holders stake while keeping liquidity.",
    category: "Staking",
    website: "https://hydroprotocol.io",
    tvl: 3_200_000,
    status: "approved",
  },
  {
    name: "Talis Protocol",
    slug: "talis-protocol",
    description: "NFT marketplace and launchpad for creators and collectors on Injective.",
    category: "NFT",
    website: "https://talis.art",
    twitter: "https://twitter.com/talisprotocol",
    status: "approved",
  },
  {
    name: "Injective Bridge",
    slug: "injective-bridge",
    description: "Official cross-chain bridge for moving assets in and out of Injective.",
    category: "Infrastructure",
    website: "https://bridge.injective.network",
    status: "approved",
  },
  {
    name: "Dojo Swap",
    slug: "dojo-swap",
    description: "Community-driven AMM and DEX aggregator for the Injective ecosystem.",
    category: "DEX",
    website: "https://dojo.trade",
    tvl: 1_100_000,
    status: "approved",
  },
  {
    name: "Neptune Finance",
    slug: "neptune-finance",
    description: "Lending and borrowing markets for major assets on Injective.",
    category: "Lending",
    website: "https://neptunefinance.io",
    tvl: 2_400_000,
    status: "approved",
  },
  {
    name: "Keplr Wallet",
    slug: "keplr-wallet",
    description: "Popular multi-chain wallet with full support for Injective and IBC assets.",
    category: "Wallet",
    website: "https://keplr.app",
    status: "approved",
  },
  {
    name: "Injective DAO",
    slug: "injective-dao",
    description: "On-chain governance hub for INJ holders to vote on protocol proposals.",
    category: "DAO",
    website: "https://hub.injective.network",
    status: "approved",
  },
  {
    name: "White Whale",
    slug: "white-whale",
    description: "Cross-chain AMM and liquidity hub bringing deep, capital-efficient markets to Injective.",
    category: "DEX",
    website: "https://whitewhale.money",
    status: "approved",
  },
  {
    name: "Frontrunner",
    slug: "frontrunner",
    description: "On-chain prediction and outcome markets for sports and crypto events on Injective.",
    category: "Other",
    website: "https://frontrunner.market",
    status: "approved",
  },
  {
    name: "Oraichain",
    slug: "oraichain",
    description: "IBC-enabled Layer 1 providing AI oracles and verifiable AI data feeds to Injective dApps.",
    category: "AI",
    website: "https://orai.io",
    twitter: "https://twitter.com/oraichain",
    featured: true,
    status: "approved",
  },
  {
    name: "SubQuery",
    slug: "subquery",
    description: "Open-source data indexer giving developers fast, custom APIs over Injective's on-chain data.",
    category: "Infrastructure",
    website: "https://subquery.network",
    status: "approved",
  },
  {
    name: "Ninji",
    slug: "ninji",
    description: "NFT collection and community platform native to the Injective ecosystem.",
    category: "NFT",
    website: "https://ninji.io",
    status: "approved",
  },
  {
    name: "Bantr",
    slug: "bantr",
    description: "Social leaderboard platform tracking community engagement and on-chain activity across Injective projects.",
    category: "Other",
    website: "https://bantr.com",
    status: "approved",
  },

  // ---- Added: additional verified Injective ecosystem projects ----
  {
    name: "Astroport",
    slug: "astroport",
    description: "One of the largest AMMs in Cosmos, selected Injective as an L1 destination chain for deep, capital-efficient liquidity pools.",
    category: "DEX",
    website: "https://astroport.fi",
    status: "approved",
  },
  {
    name: "Bondi Finance",
    slug: "bondi-finance",
    description: "Fixed-income layer for Injective giving users direct on-chain access to real corporate bonds, with coupons paid automatically on-chain.",
    category: "RWA",
    status: "approved",
  },
  {
    name: "Stakely",
    slug: "stakely",
    description: "Non-custodial staking service letting INJ holders run nodes and earn staking rewards easily.",
    category: "Staking",
    website: "https://stakely.io",
    status: "approved",
  },
  {
    name: "Guardarian",
    slug: "guardarian",
    description: "Fiat-to-crypto onramp enabling instant, seamless conversion between traditional currency and digital assets for Injective users.",
    category: "Other",
    website: "https://guardarian.com",
    status: "approved",
  },
  {
    name: "Gem Wallet",
    slug: "gem-wallet",
    description: "Open-source multi-chain crypto wallet supporting Injective alongside BTC, ETH, SOL, BNB, and other major assets.",
    category: "Wallet",
    status: "approved",
  },
  {
    name: "Hyper Ninja",
    slug: "hyper-ninja",
    description: "On-chain strategy game where players recruit ninjas, build mining bases, and earn tokens through fully on-chain resource management.",
    category: "Gaming",
    status: "approved",
  },
];

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGO_URI / MONGODB_URI not found.");
    console.error("Looked for .env at:", path.resolve(__dirname, "../.env"));
    console.error("Make sure that file exists and contains MONGO_URI=...");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
  } catch (err) {
    // If the SRV DNS lookup still fails even after forcing Google DNS,
    // give a clear pointer to the non-SRV connection string workaround
    // instead of just dumping the raw DNS error.
    if (err?.code === "ECONNREFUSED" && String(err?.syscall) === "querySrv") {
      console.error(
        "Could not resolve MongoDB Atlas SRV record even after forcing DNS to 8.8.8.8/8.8.4.4."
      );
      console.error(
        "This usually means a VPN, firewall, or antivirus on this machine is blocking DNS SRV (port 53) lookups."
      );
      console.error(
        "Workaround: in MongoDB Atlas -> Connect -> Drivers, switch to the 'Standard connection string' (starts with mongodb:// not mongodb+srv://) and use that as MONGO_URI instead."
      );
      process.exit(1);
    }
    throw err;
  }

  console.log("Connected to MongoDB");

  for (const project of sampleProjects) {
    await EcosystemProject.findOneAndUpdate(
      { slug: project.slug },
      project,
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`Seeded: ${project.name}`);
  }

  console.log(`Done. Seeded ${sampleProjects.length} projects.`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
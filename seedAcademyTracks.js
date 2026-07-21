/**
 * seedAcademyTracks.js
 * ------------------------------------------------------------------
 * One-time seed script for the four Academy tracks (mirrors the
 * FALLBACK_TRACKS content in Academy.jsx so what the frontend shows
 * before the API responds matches what the API actually returns).
 *
 * Run once after connecting to MongoDB:
 *   node seedAcademyTracks.js
 *
 * NOTE: this file previously had no dotenv import, so process.env.MONGO_URI
 * was always undefined when running it standalone (server.js loads dotenv
 * itself, but this script is run separately with `node seedAcademyTracks.js`
 * and never went through server.js). That silently pointed this script at
 * the local-Mongo fallback URL below instead of whatever remote/Atlas URI
 * is in your .env — so tracks got seeded into a database the real server
 * never reads from, and enroll kept saying "That track does not exist"
 * even after a "successful" seed. The import below fixes that.
 *
 * ALSO NOTE: server.js overrides Node's DNS servers to 1.1.1.1/8.8.8.8
 * because some networks/ISPs can't resolve the SRV record that
 * mongodb+srv:// Atlas URIs need (fails with "querySrv ECONNREFUSED").
 * This script connects to MongoDB independently of server.js, so it
 * needs that same override — otherwise it can fail with that DNS error
 * even when the URI and credentials are correct.
 * ------------------------------------------------------------------
 */

import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";
import AcademyTrack from "./models/AcademyTrack.model.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/injective_pk";

const TRACKS = [
  {
    slug: "foundations",
    step: 1,
    level: "Foundations",
    title: "How Injective Works",
    description:
      "The mental model every other track builds on: what a Layer-1 order book chain is, how Injective differs from Ethereum L2s, and why it exists.",
    durationHours: 3,
    modules: [
      { title: "Blockchains, in plain terms", minutes: 12, order: 1 },
      { title: "Injective vs. Ethereum L2s", minutes: 15, order: 2 },
      { title: "Wallets: Keplr & MetaMask setup", minutes: 18, order: 3 },
      { title: "Reading a block explorer", minutes: 14, order: 4 },
    ],
  },
  {
    slug: "trader",
    step: 2,
    level: "Trader Track",
    title: "Trading On-Chain Order Books",
    description:
      "Move from spectator to participant: place your first trade on Helix, understand order types, and manage risk on a fully on-chain exchange.",
    durationHours: 4,
    modules: [
      { title: "Spot vs. perpetual markets", minutes: 16, order: 1 },
      { title: "Order book mechanics on Helix", minutes: 20, order: 2 },
      { title: "Placing market & limit orders", minutes: 18, order: 3 },
      { title: "Position sizing & risk basics", minutes: 22, order: 4 },
    ],
  },
  {
    slug: "builder",
    step: 3,
    level: "Builder Track",
    title: "Shipping on Injective",
    description:
      "For developers: spin up a local environment, understand the module system, and deploy a working contract to testnet.",
    durationHours: 6,
    modules: [
      { title: "Dev environment & CLI setup", minutes: 20, order: 1 },
      { title: "Injective's module architecture", minutes: 25, order: 2 },
      { title: "Writing your first contract", minutes: 35, order: 3 },
      { title: "Testnet deployment walkthrough", minutes: 28, order: 4 },
    ],
  },
  {
    slug: "validator",
    step: 4,
    level: "Advanced",
    title: "Staking & Validator Economics",
    description:
      "How consensus, delegation, and the weekly burn auction fit together — and what it takes to run or delegate to a validator responsibly.",
    durationHours: 3,
    modules: [
      { title: "Proof-of-stake on Injective", minutes: 14, order: 1 },
      { title: "Choosing a validator to delegate to", minutes: 16, order: 2 },
      { title: "Unstaking periods & slashing risk", minutes: 12, order: 3 },
      { title: "Inside the burn auction", minutes: 18, order: 4 },
    ],
  },
];

async function seed() {
  console.log("Using MONGO_URI:", MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  for (const track of TRACKS) {
    await AcademyTrack.findOneAndUpdate({ slug: track.slug }, track, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    console.log(`Upserted track: ${track.slug}`);
  }

  console.log("Done seeding Academy tracks.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
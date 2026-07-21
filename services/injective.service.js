import axios from "axios";

// Official Injective LCD
const LCD_BASE = "https://lcd.injective.network";

const api = axios.create({
  baseURL: LCD_BASE,
  timeout: 15000,
});

// ===============================
// Total Staked INJ
// ===============================
export async function getStakedInj() {
  try {
    const { data } = await api.get("/cosmos/staking/v1beta1/pool");

    const bonded = Number(data?.pool?.bonded_tokens ?? 0) / 1e18;

    return {
      staked: bonded,
    };
  } catch (err) {
    console.error("getStakedInj:", err.message);

    return {
      staked: null,
    };
  }
}

// ===============================
// Total Supply
// ===============================
export async function getSupplyInfo() {
  try {
    const { data } = await api.get(
      "/cosmos/bank/v1beta1/supply/by_denom?denom=inj"
    );

    const supply = Number(data?.amount?.amount ?? 0) / 1e18;

    return {
      totalSupply: supply,
    };
  } catch (err) {
    console.error("getSupplyInfo:", err.message);

    return {
      totalSupply: null,
    };
  }
}

// ===============================
// Burned INJ (static approximate figure)
// ===============================
//
// Injective's LCD doesn't expose a single "total burned" endpoint —
// burn data comes from summing auction-module rounds on-chain, which
// isn't practical for a live homepage call. Using a static, periodically
// updated approximate figure instead.
//
// Last updated: July 2026, based on public data:
//   - ~6.78M INJ burned via the original weekly Burn Auction
//   - ~178,338 INJ burned across 4 Community BuyBack rounds (since Nov 2025)
//   Total ≈ 6.96M INJ
//
// TODO: Update this number periodically (e.g. monthly) from
// https://injective.com/blog or the Injective Hub buyback page,
// or replace with a real indexer once available.
export async function getBurnedInj() {
  const STATIC_TOTAL_BURNED_INJ = 6_960_000;

  return {
    burned: STATIC_TOTAL_BURNED_INJ,
  };
}
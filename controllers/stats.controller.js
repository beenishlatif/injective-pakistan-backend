import { getInjPrice } from "../services/coingecko.service.js";
import { getStakedInj, getSupplyInfo } from "../services/injective.service.js";

export const getLiveStats = async (req, res) => {
  try {
    const [priceData, stakedData, supplyData] = await Promise.allSettled([
      getInjPrice(),
      getStakedInj(),
      getSupplyInfo(),
    ]);

    res.json({
      price:
        priceData.status === "fulfilled" ? priceData.value : null,
      staked:
        stakedData.status === "fulfilled" ? stakedData.value.staked : null,
      totalSupply:
        supplyData.status === "fulfilled" ? supplyData.value.totalSupply : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch live stats" });
  }
};

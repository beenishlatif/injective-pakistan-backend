import axios from "axios";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=injective-protocol&vs_currencies=usd&include_24hr_change=true&include_market_cap=true";

export const getInjPrice = async () => {
  try {
    const { data } = await axios.get(COINGECKO_URL);
    const inj = data["injective-protocol"];
    return {
      price: inj.usd,
      change24h: inj.usd_24h_change,
      marketCap: inj.usd_market_cap,
    };
  } catch (err) {
    console.error("CoinGecko fetch error:", err.message);
    throw new Error("Failed to fetch INJ price");
  }
};

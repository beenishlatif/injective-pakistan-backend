import axios from "axios";

export async function getHelixVolume24h() {
  try {
    const { data } = await axios.get(
      "https://api.llama.fi/summary/dexs/Helix",
      {
        timeout: 10000,
      }
    );

    return {
      volume24h:
        data?.total24h ||
        data?.total24hVolume ||
        data?.volume24h ||
        null,
    };
  } catch (err) {
    console.error("getHelixVolume24h:", err.message);

    return {
      volume24h: null,
    };
  }
}
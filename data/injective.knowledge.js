/**
 * injective.knowledge.js
 * ------------------------------------------------------------------
 * Grounding context injected into the system prompt so the assistant
 * answers Injective-related questions accurately, even if the model's
 * own training data is outdated. Update this file as facts change —
 * it is the single source of truth the AI is told to rely on.
 * ------------------------------------------------------------------
 */

const INJECTIVE_KNOWLEDGE = `
INJECTIVE PROTOCOL — CORE FACTS

1. What it is
   - Injective is a Layer-1 blockchain purpose-built for finance, built with the
     Cosmos SDK and Tendermint (CometBFT) Proof-of-Stake consensus.
   - It is interoperable via IBC (Inter-Blockchain Communication) with the Cosmos
     ecosystem, and connects to Ethereum, Solana, and other ecosystems through
     bridges and its multi-VM architecture.
   - Injective supports multiple execution environments (multi-VM): CosmWasm
     smart contracts and an native EVM layer, letting Solidity and CosmWasm
     developers deploy on the same chain and share liquidity/order book infra.

2. Native token — INJ
   - INJ is the native utility and governance token.
   - Used for: paying gas fees, staking with validators for network security,
     on-chain governance voting, and as collateral in DeFi apps built on Injective.
   - INJ has a deflationary "burn auction" mechanism: a share of protocol fees
     from dApps across the ecosystem are pooled weekly into a basket, auctioned
     off in INJ, and the winning INJ bid is permanently burned.

3. Exchange / orderbook module
   - Injective's standout feature is a fully on-chain, decentralized central
     limit order book (CLOB) module built directly into the chain layer
     (not an AMM), offering spot and derivatives (perpetual futures) trading
     with sub-second finality and no gas fees for placing/canceling orders in
     many front-ends (relayers cover/rebate gas).
   - Because the order book is a chain module, any dApp can plug into shared
     liquidity instead of bootstrapping its own — this is often called
     "plug-and-play" DeFi infrastructure.

4. Ecosystem
   - dApps built on Injective span perpetual/derivatives exchanges, spot DEXs,
     prediction markets, RWA (real-world asset) tokenization platforms, lending,
     and structured products.
   - Helix is a well-known flagship front-end DEX built on Injective's exchange
     module.
   - Injective has an EVM mainnet layer enabling Ethereum-native dApps and
     tooling (MetaMask, Solidity contracts) to deploy directly on Injective.

5. Governance & staking
   - INJ holders can stake to validators to help secure the network and earn
     staking rewards; unstaking is subject to an unbonding period.
   - Governance proposals (parameter changes, upgrades, new markets) are voted
     on by staked INJ holders.

6. Common developer facts
   - SDKs available for JavaScript/TypeScript, Python, Go, and Rust to interact
     with Injective's chain and exchange APIs.
   - Testnet is available for developers to build and test without real funds.
   - Explorer, faucet, and Hub (staking/governance dashboard) are core parts of
     the public-facing Injective toolset.

IMPORTANT GROUNDING RULES FOR THE ASSISTANT:
- If asked about the CURRENT INJ price, market cap, current validator count,
  or any live/real-time figure, say clearly that you don't have live market
  data and suggest checking a live source (e.g. the Injective Hub, a price
  tracker, or the official Injective website), rather than guessing a number.
- If a question is outside Injective / blockchain / crypto scope, answer
  briefly and helpfully, then gently steer back to how you can help with
  Injective-related topics.
- Never fabricate specific statistics, dates, or partnership details you are
  not certain about — say so plainly instead of guessing.
`;

export { INJECTIVE_KNOWLEDGE };
/**
 * anthropic.service.js
 * ------------------------------------------------------------------
 * Thin wrapper around the Anthropic Messages API.
 * Requires: npm install @anthropic-ai/sdk
 * Requires env var: ANTHROPIC_API_KEY
 * ------------------------------------------------------------------
 */

import Anthropic from "@anthropic-ai/sdk";
import { INJECTIVE_KNOWLEDGE } from "../data/injective.knowledge.js";

if (!process.env.ANTHROPIC_API_KEY) {
  // Fail loudly at boot rather than silently at request time.
  console.warn(
    "[anthropic.service] WARNING: ANTHROPIC_API_KEY is not set. AI requests will fail."
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6"; // current production model string
const MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are "Nova", the official AI assistant embedded on the Injective
Protocol website. Your job is to answer visitor questions about Injective
(the blockchain, INJ token, ecosystem, staking, trading, and building on it)
quickly, accurately, and in a friendly but knowledgeable tone — like a sharp
member of the Injective developer relations team.

Rules:
- Keep answers concise by default (2-6 sentences), and only go longer if the
  user asks for depth or a step-by-step explanation.
- Use the reference knowledge below as your grounding source of truth.
- If you don't know something or it requires live data, say so honestly.
- Use plain, confident language — avoid hype/marketing filler.
- Format with short paragraphs or bullet points when listing multiple items.

${INJECTIVE_KNOWLEDGE}`;

/**
 * Send a chat turn to Claude and get back a plain-text answer.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @returns {Promise<string>}
 */
async function askInjectiveAssistant(history) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

/**
 * Streaming variant — calls onDelta(text) for every chunk as it arrives.
 * Useful for a "typing" effect on the frontend via Server-Sent Events.
 * @param {Array<{role: string, content: string}>} history
 * @param {(deltaText: string) => void} onDelta
 */
async function streamInjectiveAssistant(history, onDelta) {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: history,
  });

  stream.on("text", (delta) => onDelta(delta));

  const finalMessage = await stream.finalMessage();
  const textBlock = finalMessage.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

export { askInjectiveAssistant, streamInjectiveAssistant };
/**
 * gemini.service.js
 * ------------------------------------------------------------------
 * Wrapper around the Google Gemini API (Google AI Studio) — FREE tier,
 * no credit card required.
 *
 * Setup:
 *   1. npm install @google/generative-ai
 *   2. Get a free key at https://aistudio.google.com  → "Get API Key"
 *   3. Add to .env:  GEMINI_API_KEY=your_key_here
 * ------------------------------------------------------------------
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { INJECTIVE_KNOWLEDGE } from "../data/injective.knowledge.js";

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    "[gemini.service] WARNING: GEMINI_API_KEY is not set. AI requests will fail."
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL = "gemini-flash-latest"; // alias — always points to Google's current flash model
const MAX_OUTPUT_TOKENS = 1024;

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
 * Gemini expects roles 'user' and 'model' (not 'assistant'), and needs
 * history as an array of { role, parts: [{ text }] }.
 */
function toGeminiHistory(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function getModel() {
  return genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  });
}

/**
 * Send a chat turn to Gemini and get back a plain-text answer.
 * @param {Array<{role: 'user'|'assistant', content: string}>} history
 * @returns {Promise<string>}
 */
async function askInjectiveAssistant(history) {
  const model = getModel();
  const geminiHistory = toGeminiHistory(history);
  const lastMessage = geminiHistory.pop(); // last user turn sent separately

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  return result.response.text();
}

/**
 * Streaming variant — calls onDelta(text) for every chunk as it arrives.
 * @param {Array<{role: string, content: string}>} history
 * @param {(deltaText: string) => void} onDelta
 */
async function streamInjectiveAssistant(history, onDelta) {
  const model = getModel();
  const geminiHistory = toGeminiHistory(history);
  const lastMessage = geminiHistory.pop();

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(lastMessage.parts[0].text);

  let full = "";
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      onDelta(text);
    }
  }
  return full;
}

export { askInjectiveAssistant, streamInjectiveAssistant };
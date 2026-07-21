/**
 * ai.controller.js
 * ------------------------------------------------------------------
 * Handles incoming chat requests from the frontend AIAssistant widget.
 * Two endpoints are supported:
 *   POST /api/ai/chat         -> normal JSON response
 *   POST /api/ai/chat/stream  -> Server-Sent Events (typing effect)
 *
 * Every conversation is now persisted to MongoDB via the ChatSession
 * model, so old chats survive reloads/restarts and can be listed in
 * the "History" sidebar. Additional endpoints are exported for that:
 *   GET    /api/ai/sessions            -> list all saved chats
 *   GET    /api/ai/sessions/:sessionId -> load one chat's messages
 *   DELETE /api/ai/sessions/:sessionId -> delete one chat
 * ------------------------------------------------------------------
 */

import {
  askInjectiveAssistant,
  streamInjectiveAssistant,
} from "../services/gemini.service.js";
import ChatSession from "../models/chatSession.model.js";

const MAX_HISTORY_TURNS = 12; // keep last N turns to control token usage
const MAX_MESSAGE_LENGTH = 2000;
const TITLE_MAX_LENGTH = 42;

/**
 * Basic validation + normalization of the incoming conversation history.
 * Expected body: { messages: [{ role: 'user' | 'assistant', content: string }] }
 */
function validateAndTrimHistory(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: "`messages` must be a non-empty array." };
  }

  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) {
      return { error: "Each message must have role 'user' or 'assistant'." };
    }
    if (typeof m.content !== "string" || !m.content.trim()) {
      return { error: "Each message must have non-empty string content." };
    }
    if (m.content.length > MAX_MESSAGE_LENGTH) {
      return { error: `Message content exceeds ${MAX_MESSAGE_LENGTH} characters.` };
    }
  }

  // Last message must be from the user (the new question).
  if (messages[messages.length - 1].role !== "user") {
    return { error: "The last message in the conversation must be from the user." };
  }

  const trimmed = messages.slice(-MAX_HISTORY_TURNS * 2);
  return { trimmed };
}

/**
 * Derives a short readable title for a chat session from its first
 * user message — used when a new session is created.
 */
function deriveTitle(messages) {
  const firstUser = messages.find((m) => m.role === "user" && m.content?.trim());
  if (!firstUser) return "New conversation";
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > TITLE_MAX_LENGTH
    ? text.slice(0, TITLE_MAX_LENGTH) + "…"
    : text;
}

/**
 * Saves (creates or updates) a chat session with the full message
 * list. Returns the session's id as a string. Never throws upward —
 * callers decide whether a persistence failure should affect the
 * user-facing response.
 */
async function persistSession(sessionId, fullMessages) {
  const title = deriveTitle(fullMessages);

  if (sessionId) {
    const updated = await ChatSession.findByIdAndUpdate(
      sessionId,
      { messages: fullMessages, title },
      { new: true }
    );
    if (updated) return updated._id.toString();
  }

  const created = await ChatSession.create({ messages: fullMessages, title });
  return created._id.toString();
}

/**
 * POST /api/ai/chat
 * Standard request/response — good default, simplest to integrate.
 * Body may optionally include `sessionId` to continue an existing
 * saved chat; if omitted (or not found) a new chat is created.
 */
async function handleChat(req, res) {
  try {
    const { messages, sessionId } = req.body;
    const { error, trimmed } = validateAndTrimHistory(messages);
    if (error) return res.status(400).json({ success: false, error });

    const reply = await askInjectiveAssistant(trimmed);

    let savedSessionId = sessionId || null;
    try {
      const fullHistory = [...messages, { role: "assistant", content: reply }];
      savedSessionId = await persistSession(sessionId, fullHistory);
    } catch (persistErr) {
      console.error("[ai.controller] failed to persist chat session:", persistErr);
    }

    return res.status(200).json({
      success: true,
      reply,
      sessionId: savedSessionId,
    });
  } catch (err) {
    console.error("[ai.controller] handleChat error:", err);
    return res.status(500).json({
      success: false,
      error: "Something went wrong while contacting the AI assistant. Please try again.",
    });
  }
}

/**
 * POST /api/ai/chat/stream
 * Server-Sent Events — frontend renders the answer token-by-token.
 * Body may optionally include `sessionId`, same as handleChat. The
 * (possibly new) sessionId is sent back on the "done" event.
 */
async function handleChatStream(req, res) {
  const { messages, sessionId } = req.body;
  const { error, trimmed } = validateAndTrimHistory(messages);
  if (error) {
    return res.status(400).json({ success: false, error });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let accumulated = "";

  try {
    await streamInjectiveAssistant(trimmed, (delta) => {
      accumulated += delta;
      send("delta", { text: delta });
    });

    let savedSessionId = sessionId || null;
    try {
      const fullHistory = [...messages, { role: "assistant", content: accumulated }];
      savedSessionId = await persistSession(sessionId, fullHistory);
    } catch (persistErr) {
      console.error("[ai.controller] failed to persist chat session:", persistErr);
    }

    send("done", { sessionId: savedSessionId });
  } catch (err) {
    console.error("[ai.controller] handleChatStream error:", err);
    send("error", { message: "The assistant hit an error mid-response." });
  } finally {
    res.end();
  }
}

/**
 * GET /api/ai/sessions
 * Returns a lightweight list of all saved chats (for the History
 * sidebar) — id, title, and timestamps only, no message bodies.
 */
async function listSessions(req, res) {
  try {
    const sessions = await ChatSession.find({}, { title: 1, createdAt: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      sessions: sessions.map((s) => ({
        sessionId: s._id.toString(),
        title: s.title,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  } catch (err) {
    console.error("[ai.controller] listSessions error:", err);
    return res.status(500).json({
      success: false,
      error: "Could not load chat history.",
    });
  }
}

/**
 * GET /api/ai/sessions/:sessionId
 * Loads the full message list for one saved chat, so the frontend
 * can restore it when the user clicks it in History.
 */
async function getSession(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findById(sessionId).lean();

    if (!session) {
      return res.status(404).json({ success: false, error: "Chat not found." });
    }

    return res.status(200).json({
      success: true,
      sessionId: session._id.toString(),
      title: session.title,
      messages: session.messages.map(({ role, content }) => ({ role, content })),
    });
  } catch (err) {
    console.error("[ai.controller] getSession error:", err);
    return res.status(500).json({
      success: false,
      error: "Could not load this chat.",
    });
  }
}

/**
 * DELETE /api/ai/sessions/:sessionId
 * Removes a saved chat permanently.
 */
async function deleteSession(req, res) {
  try {
    const { sessionId } = req.params;
    const deleted = await ChatSession.findByIdAndDelete(sessionId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Chat not found." });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[ai.controller] deleteSession error:", err);
    return res.status(500).json({
      success: false,
      error: "Could not delete this chat.",
    });
  }
}

export {
  handleChat,
  handleChatStream,
  listSessions,
  getSession,
  deleteSession,
};
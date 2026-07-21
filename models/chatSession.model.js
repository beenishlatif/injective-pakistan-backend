/**
 * chatSession.model.js
 * ------------------------------------------------------------------
 * Mongoose model used to persist every chat conversation so old
 * chats survive server restarts / page reloads and can be listed in
 * the frontend's "History" sidebar.
 * ------------------------------------------------------------------
 */

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } }
);

const chatSessionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "New conversation" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true } // adds createdAt + updatedAt
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
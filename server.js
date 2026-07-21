import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import dns from "dns";
import statsRoutes from "./routes/stats.routes.js";
import ecosystemRoutes from "./routes/ecosystem.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import academyRoutes from "./routes/academy.routes.js";
import gameRoutes from "./routes/game.routes.js";
import authRoutes from "./routes/auth.routes.js";
import homeRoutes from "./routes/home.routes.js";
import communityRoutes from "./routes/community.routes.js";

const app = express();
const server = http.createServer(app);

dns.setServers(["1.1.1.1", "8.8.8.8"]);

/**
 * CORS — allow-list of origins
 * ------------------------------------------------------------------
 * Because the frontend sends requests with credentials (cookies /
 * withCredentials: true), we can NOT use origin: "*". We must return
 * one specific origin per request, so we keep a whitelist and use a
 * function so both local dev AND the deployed Vercel frontend work
 * from the same backend, without needing separate deployments.
 *
 * CLIENT_URL / FRONTEND_URL env vars can still be used to add an
 * extra origin (e.g. a staging URL) without touching this file.
 * ------------------------------------------------------------------
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://injective-pakistan-frontend-twj2.vercel.app", // deployed frontend
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, server-to-server, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow any Vercel preview deployment of the frontend
      // (e.g. injective-pakistan-frontend-twj2-git-branch-xyz.vercel.app)
      if (/^https:\/\/injective-pakistan-frontend-.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked request from origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({ status: "Injective Pakistan Hub API is running" });
});

app.use("/api/stats", statsRoutes);
app.use("/api/ecosystem", ecosystemRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/community", communityRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong on the server.",
  });
});

const PORT = process.env.PORT || 5000;

// Vercel runs this file as a serverless function and imports the
// exported `app` directly — it does NOT call app.listen(). Calling
// listen() there just gets ignored, but we guard it anyway so local
// `node server.js` / `npm run dev` still works normally.
if (!process.env.VERCEL) {
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

export default app;
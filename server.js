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

// credentials: true is required because the frontend sends
// requests with withCredentials: true. When credentials are used,
// origin can NOT be "*" — it must be one specific URL.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
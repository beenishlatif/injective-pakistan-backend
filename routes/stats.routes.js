import express from "express";
import { getLiveStats } from "../controllers/stats.controller.js";

const router = express.Router();

router.get("/", getLiveStats);

export default router;

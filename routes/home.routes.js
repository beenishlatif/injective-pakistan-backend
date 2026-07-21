import express from "express";
import {
  getLiveStats,
  getFeaturedEcosystem,
} from "../controllers/home.controller.js";

const router = express.Router();

router.get("/stats", getLiveStats);
router.get("/ecosystem-featured", getFeaturedEcosystem);

export default router;
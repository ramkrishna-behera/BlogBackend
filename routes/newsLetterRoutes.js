import express from "express";
import { subscribe, health } from "../controllers/newsLetterController.js";

const router = express.Router();

// POST /api/newsletter
router.post("/", subscribe);

// GET /api/newsletter/health
router.get("/health", health);

export default router;

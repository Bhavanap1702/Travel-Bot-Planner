// src/routes/planRoutes.js
import express from "express";
import mongoose from "mongoose";
import Place from "../models/place.js"; // <-- MongoDB model
import { generatePlanController } from "../controllers/planController.js";
import { searchPOI } from "../services/vector_search.js";
import { generateAnswer } from "../services/llm.js";
import { getCachedPOI, setCachedPOI } from "../services/cache.js";

const router = express.Router();

// 🔹 MongoDB POI search
router.get("/pois/db/search", async (req, res) => {
  try {
    const { query, topK } = req.query;
    if (!query) return res.status(400).json({ error: "query is required" });

    // Simple MongoDB text search (you can enhance with indexes)
    const results = await Place.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).limit(parseInt(topK) || 5);

    res.json(results);
  } catch (err) {
    console.error("❌ Error searching MongoDB POI:", err);
    res.status(500).json({ error: "Failed to search MongoDB POI" });
  }
});

// 🔹 Fast POI search with cache + Chroma
router.get("/pois/search", async (req, res) => {
  try {
    const { query, topK } = req.query;
    if (!query) return res.status(400).json({ error: "query is required" });

    const cached = getCachedPOI(query);
    if (cached) {
      console.log("⚡ Cache hit for:", query);
      return res.json(cached);
    }

    const results = await searchPOI(query, parseInt(topK) || 5);
    setCachedPOI(query, results);

    res.json(results);
  } catch (err) {
    console.error("❌ Error searching POI:", err);
    res.status(500).json({ error: "Failed to search POI" });
  }
});

// 🔹 Travel plan generation
router.post("/plan", generatePlanController);

// 🔹 Chatbot endpoint using MongoDB + Chroma fallback
router.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });

    // First check cache
    let pois = getCachedPOI(query);

    if (!pois) {
      // Try MongoDB search first
      pois = await Place.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      }).limit(5);

      // Fallback to Chroma if no MongoDB results
      if (!pois.length) {
        pois = await searchPOI(query, 5);
      }

      setCachedPOI(query, pois);
    }

    const answer = await generateAnswer(query, pois);

    res.json({ answer, context: pois });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ answer: "Sorry, I couldn’t process that." });
  }
});

export default router;

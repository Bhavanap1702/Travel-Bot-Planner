// src/routes/plan.js
import { Router } from "express";
import { planItinerary } from "../services/planner.js";

const r = Router();

// POST /api/plan
r.post("/", async (req, res) => {
  try {
    const out = await planItinerary(req.body); // expects { origin, city, days, budgetTier, interests }
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;

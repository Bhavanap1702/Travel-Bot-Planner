// src/routes/route.js
import { Router } from "express";
import { computeRoute } from "../services/route.js";

const r = Router();

// POST /api/route
r.post("/", async (req, res) => {
  try {
    // body: { origin: {lat,lng}, destinations: [{lat,lng,name}], mode }
    const out = await computeRoute(req.body);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;

// src/routes/places.js
import { Router } from "express";
import Place from "../models/place.js";

const r = Router();

// GET /api/places?city=jaipur
r.get("/", async (req, res) => {
  try {
    const city = (req.query.city || "").toLowerCase();
    const q = city ? { city } : {};
    const places = await Place.find(q).sort({ popularity: -1 }).limit(50);
    res.json(places);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;

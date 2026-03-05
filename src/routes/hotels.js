// src/routes/hotels.js
import { Router } from "express";
import Hotel from "../models/hotel.js";

const r = Router();

// GET /api/hotels?city=jaipur
r.get("/", async (req, res) => {
  try {
    const city = (req.query.city || "").toLowerCase();
    const q = city ? { city } : {};
    const hotels = await Hotel.find(q).sort({ priceNight: 1 }).limit(50);
    res.json(hotels);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default r;

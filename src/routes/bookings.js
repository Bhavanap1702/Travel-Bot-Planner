// src/routes/bookings.js
import { Router } from "express";
import Booking from "../models/booking.js";
import { randomUUID } from "crypto";

const r = Router();

// POST /api/bookings/hold  -> returns mock PNR hold
r.post("/hold", async (req, res) => {
  try {
    const { type, details } = req.body;
    const b = new Booking({
      userId: req.body.userId || null,
      type,
      details,
      status: "hold",
      pnr: `PNR${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      createdAt: new Date()
    });
    await b.save();
    res.json({ ok: true, booking: b });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/bookings/confirm
r.post("/confirm", async (req, res) => {
  try {
    const { bookingId } = req.body;
    const b = await Booking.findById(bookingId);
    if (!b) return res.status(404).json({ error: "Booking not found" });
    b.status = "confirmed";
    await b.save();
    res.json({ ok: true, booking: b });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;

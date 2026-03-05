
// src/models/Booking.js
import mongoose from "mongoose";
const BookingSchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  type: String,
  details: Object,
  status: { type: String, enum: ["hold","confirmed","cancelled"], default: "hold" },
  pnr: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Booking", BookingSchema);

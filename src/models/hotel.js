// src/models/Hotel.js
import mongoose from "mongoose";
const HotelSchema = new mongoose.Schema({
  name: String,
  city: { type: String, index: true, lowercase: true },
  stars: Number,
  priceNight: Number,
  amenities: [String],
  geo: { lat: Number, lng: Number },
  photos: [String]
});
export default mongoose.model("Hotel", HotelSchema);

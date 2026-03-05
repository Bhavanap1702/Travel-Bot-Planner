import mongoose from "mongoose";

const POISchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  budgetTier: { type: String }, // e.g., low, medium, high
  type: { type: String },       // e.g., history, nature, cultural
  coordinates: { type: [Number], required: true }, // [longitude, latitude]
  description: { type: String }
});

export default mongoose.model("POI", POISchema);

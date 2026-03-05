import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  name: String,
  category: String,
  rating: Number,
  opening_hours: String,
  description: String,
  latitude: Number,
  longitude: Number
});

const Place = mongoose.model("Place", placeSchema);

export default Place;

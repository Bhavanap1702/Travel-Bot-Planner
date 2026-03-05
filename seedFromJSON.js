import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import POI from "./src/models/POI.js";

dotenv.config();

// Load JSON data
const data = JSON.parse(fs.readFileSync("./data/places.json", "utf-8"));

// Map city names based on POI names
const cityMap = {
  "Kolkata": "Kolkata",
  "Bengaluru": "Bangalore",
  "Jaipur": "Jaipur",
  "Amritsar": "Amritsar"
};

const POIs = data.map(item => {
  // Find the city key in the name
  const cityKey = Object.keys(cityMap).find(key => item.name.includes(key));
  return {
    name: item.name,
    city: cityKey ? cityMap[cityKey] : "Unknown",  // fallback if city not found
    state: "", // optional
    budgetTier: "medium", // default value
    type: item.category.toLowerCase(), // convert category to lowercase for filtering
    coordinates: [item.longitude, item.latitude],
    description: item.description
  };
});

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing POIs
    await POI.deleteMany({});
    console.log("🗑️ Cleared existing POIs");

    // Insert new POIs
    await POI.insertMany(POIs);
    console.log(`✅ Seeded ${POIs.length} POIs from places.json`);

    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding POIs:", err);
  }
};

seed();

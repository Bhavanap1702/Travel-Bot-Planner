// scripts/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Place from "../src/models/place.js";
import Hotel from "../src/models/hotel.js";


dotenv.config();

// Prefer Atlas → fallback to local
const MONGO = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI || "mongodb://127.0.0.1:27017/travelbot";

async function run() {
  try {
    await mongoose.connect(MONGO);
    console.log("✅ Connected to MongoDB for seeding:", MONGO);

    // Clear existing collections (be careful in production!)
    await Place.deleteMany({});
    await Hotel.deleteMany({});

    // Load cities
    const cityDir = path.resolve("data/cities");
    const cityFiles = fs.readdirSync(cityDir).filter(f => f.endsWith(".json"));

    for (const file of cityFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(cityDir, file), "utf8"));
      if (Array.isArray(data.places)) {
        await Place.insertMany(data.places);
        console.log(`📍 Inserted ${data.places.length} places from ${file}`);
      }
    }

    // Load hotels
    const hotelDir = path.resolve("data/hotels");
    const hotelFiles = fs.readdirSync(hotelDir).filter(f => f.endsWith(".json"));

    for (const file of hotelFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(hotelDir, file), "utf8"));
      if (Array.isArray(data.hotels)) {
        await Hotel.insertMany(data.hotels);
        console.log(`🏨 Inserted ${data.hotels.length} hotels from ${file}`);
      }
    }

    console.log("🌱 Seed complete.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

run();

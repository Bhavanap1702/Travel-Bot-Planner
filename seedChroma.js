// seedChroma.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import POI from "./src/models/POI.js";
import { insertPOI } from "./src/services/vector_search.js";

dotenv.config();

const seedChroma = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Limit to 5 POIs for testing
    const pois = await POI.find({}).limit(5);
    console.log(`Found ${pois.length} POIs in MongoDB`);

    for (const poi of pois) {
      try {
        await insertPOI(poi._id.toString(), poi.description, {
          name: poi.name,
          city: poi.city,
          type: poi.type,
          budgetTier: poi.budgetTier,
          lat: poi.latitude,   // include latitude
          lon: poi.longitude  // include longitude
        });
        console.log(`✅ Inserted POI: ${poi.name}`);
      } catch (err) {
        console.error(`❌ OpenAI embedding error for ${poi.name}:`, err.message);
      }
    }

    console.log(`✅ Seeded ${pois.length} POIs to Chroma`);
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding Chroma:", err);
  }
};

seedChroma();

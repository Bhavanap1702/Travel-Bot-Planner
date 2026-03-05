import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Place from "./src/models/place.js"; 

dotenv.config();

const mongoUri = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Load JSON data
const places = JSON.parse(fs.readFileSync("./public/data/places.json", "utf-8"));

async function seedDB() {
  try {
    await Place.deleteMany({}); // Clear existing data
    await Place.insertMany(places); // Insert all places
    console.log("Database seeded with", places.length, "places!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();

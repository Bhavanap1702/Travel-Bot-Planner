// scripts/seed_places.js
import dotenv from "dotenv";
import { VectorStore } from "../src/services/vector_search.js";

dotenv.config();

async function seed() {
  const store = new VectorStore();
  await store.init();

  const places = [
    { id: 1, vector: [0.1, 0.2, 0.3], payload: { name: "India Gate" } },
    { id: 2, vector: [0.4, 0.5, 0.6], payload: { name: "Qutub Minar" } },
    { id: 3, vector: [0.7, 0.8, 0.9], payload: { name: "Red Fort" } },
  ];

  try {
    await store.upsert(places);
    console.log("✅ Dummy places inserted successfully");
  } catch (err) {
    console.error("Error seeding places:", err);
  }
}

seed();

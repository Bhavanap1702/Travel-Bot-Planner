// scripts/query.js
import dotenv from "dotenv";
import fetch from "node-fetch";
import { pipeline } from "@xenova/transformers";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "places_local";
const VECTOR_SIZE = 384; // must match what we used in ingest.js

// Headers for Qdrant
const headers = {
  "Content-Type": "application/json",
  ...(QDRANT_API_KEY && { Authorization: `Bearer ${QDRANT_API_KEY}` }),
};

// ✅ Initialize Xenova embeddings
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function searchPlaces(query) {
  try {
    console.log(`🔍 Searching for: "${query}"`);

    // Generate embedding for query
    const output = await embedder(query, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data);

    if (vector.length !== VECTOR_SIZE) {
      throw new Error(
        `Embedding size mismatch: expected ${VECTOR_SIZE}, got ${vector.length}`
      );
    }

    // 🔑 Ask Qdrant to return payloads
    const res = await fetch(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          vector,
          limit: 5,
          with_payload: true,   // 👈 Ensures payload (name, description, etc.) comes back
          with_vector: false,
        }),
      }
    );

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    const hits = data.result || [];

    if (hits.length === 0) {
      console.log("❌ No results found.");
      return;
    }

    console.log("✅ Search results:");
    const results = hits.map((hit, idx) => ({
      id: hit.id,
      name: hit.payload?.name || "Unknown Place",
      description: hit.payload?.description || "No description available",
      category: hit.payload?.category || "Uncategorized",
      latitude: hit.payload?.latitude,
      longitude: hit.payload?.longitude,
      score: hit.score,
    }));

    console.log(JSON.stringify(results, null, 2));
  } catch (err) {
    console.error("❌ Error in search:", err.message || err);
  }
}

// Run with CLI argument
const query = process.argv.slice(2).join(" ") || "historical places in Delhi";
await searchPlaces(query);

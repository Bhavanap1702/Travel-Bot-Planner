// scripts/ingest.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { pipeline } from "@xenova/transformers";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "places_local";
const VECTOR_SIZE = 384; // MiniLM-L6-v2 embedding dimension

// Headers for Qdrant
const headers = {
  "Content-Type": "application/json",
  ...(QDRANT_API_KEY && { Authorization: `Bearer ${QDRANT_API_KEY}` }),
};

// ✅ Initialize Xenova embeddings
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function checkQdrant() {
  try {
    const res = await fetch(`${QDRANT_URL}/collections`, { headers });
    if (!res.ok) throw new Error(await res.text());
    console.log(
      QDRANT_URL.includes("localhost")
        ? "✅ Local Qdrant API reachable"
        : "✅ Qdrant API reachable"
    );
  } catch (err) {
    console.error("❌ Cannot reach Qdrant API:", err.message || err);
    process.exit(1);
  }
}

async function recreateCollection() {
  try {
    await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "DELETE",
      headers,
    });
    console.log(`🗑️ Deleted existing collection (if any): ${COLLECTION_NAME}`);

    const res = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    console.log(`✅ Created collection: ${COLLECTION_NAME}`);
  } catch (err) {
    console.error("❌ Failed to recreate collection:", err.message || err);
    process.exit(1);
  }
}

async function embedAndUpsert() {
  try {
    const filePath = path.join(process.cwd(), "data", "places.json");
    const rawData = fs.readFileSync(filePath, "utf-8");
    const places = JSON.parse(rawData);

    const batchSize = 50;
    console.log(`🔄 Upserting ${places.length} items in batches of ${batchSize}...`);

    for (let i = 0; i < places.length; i += batchSize) {
      const batch = places.slice(i, i + batchSize);

      const vectors = [];
      for (const place of batch) {
        // ✅ Always mean-pool to get 384-dim vector
        const output = await embedder(place.description || place.name, {
          pooling: "mean",
          normalize: true,
        });
        const vector = Array.from(output.data);

        if (vector.length !== VECTOR_SIZE) {
          throw new Error(
            `Embedding size mismatch for "${place.name}": expected ${VECTOR_SIZE}, got ${vector.length}`
          );
        }

        vectors.push({
          id: uuidv4(),
          vector,
          payload: { ...place },
        });
      }

      const response = await fetch(
        `${QDRANT_URL}/collections/${COLLECTION_NAME}/points?wait=true`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ points: vectors }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Batch upsert failed: ${text}`);
      }

      console.log(`✅ Upserted batch ${i / batchSize + 1}`);
    }

    console.log("🎉 All items ingested successfully!");
  } catch (err) {
    console.error("❌ Error in ingest:", err.message || err);
  }
}

// Run everything
await checkQdrant();
await recreateCollection();
await embedAndUpsert();

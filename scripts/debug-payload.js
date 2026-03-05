// scripts/debug-payload.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || "http://localhost:6333";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || null;
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || "places_local";

const headers = {
  "Content-Type": "application/json",
  ...(QDRANT_API_KEY && { Authorization: `Bearer ${QDRANT_API_KEY}` }),
};

async function debugPayload(limit = 3) {
  console.log(`🔎 Fetching ${limit} random items from "${COLLECTION_NAME}"...`);

  const response = await fetch(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/scroll`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        limit,
        with_payload: true,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`❌ Qdrant fetch failed: ${text}`);
  }

  const result = await response.json();
  console.log("✅ Example payloads:\n", JSON.stringify(result.result, null, 2));
}

await debugPayload();

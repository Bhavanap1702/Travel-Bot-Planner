// src/services/vector_search.js
import { ChromaClient } from "chromadb";
import OpenAI from "openai";

const client = new ChromaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let cachedCollection = null; // ✅ keep a single collection in memory

// Custom embedding function using OpenAI (with fallback)
async function embedText(texts) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  } catch (err) {
    console.error("❌ OpenAI embedding error:", err.message);
    // fallback: zero vectors
    return texts.map(() => Array(1536).fill(0));
  }
}

// ✅ Cache collection
export async function getOrCreateCollection() {
  if (cachedCollection) return cachedCollection;
  cachedCollection = await client.getOrCreateCollection({
    name: "pois",
    embeddingFunction: { generate: embedText },
  });
  return cachedCollection;
}

// Insert POI once (no re-embedding on every request)
export async function insertPOI(id, description, metadata) {
  try {
    const collection = await getOrCreateCollection();
    await collection.add({
      ids: [id],
      documents: [description],
      metadatas: [metadata],
    });
    return { success: true, id };
  } catch (err) {
    console.error("❌ Insert POI error:", err);
    throw err;
  }
}

// Search POI (fast with cache in planRoutes.js)
export async function searchPOI(query, topK = 5) {
  try {
    const collection = await getOrCreateCollection();
    const results = await collection.query({
      queryTexts: [query],
      nResults: topK,
    });

    // Return structured objects instead of raw Chroma
    return results.documents[0].map((doc, i) => ({
      id: results.ids[0][i],
      description: doc,
      ...results.metadatas[0][i],
    }));
  } catch (err) {
    console.error("❌ Search POI error:", err);
    throw err;
  }
}

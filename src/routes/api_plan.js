/*
 * src/routes/api_plan.js
 * Minimal Express route for /api/plan using VectorStore + OpenAI embeddings
 */

import express from 'express';
import VectorStore from '../services/vector_search.js';
import OpenAI from 'openai';

const router = express.Router();
const vectorStore = new VectorStore({ collection: 'places', vectorSize: 1536 });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize vector store once
vectorStore.init();

router.get('/plan', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    // 1. Embed the query
    const embeddingResp = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: q,
    });
    const vector = embeddingResp.data[0].embedding;

    // 2. Search nearest neighbors in vector store
    const results = await vectorStore.search(vector, 5);

    // 3. Map results to lat/lon if payload has it
    const places = results.map(r => ({
      name: r.payload.name || 'Unknown',
      lat: r.payload.lat || 0,
      lon: r.payload.lon || 0
    }));

    res.json({ places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

export default router;

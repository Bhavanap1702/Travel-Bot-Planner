/*
 * scripts/create_and_seed_qdrant.js
 * Automatically creates the 'places' collection in Qdrant Cloud (if missing)
 * and seeds dummy places with 3D vectors.
 */

import dotenv from 'dotenv';
dotenv.config();

import VectorStore from '../src/services/vector_search.js';

const dummyPlaces = [
  { id: 1, vector: [0.1, 0.2, 0.3], payload: { name: 'India Gate', lat: 28.6129, lon: 77.2295 } },
  { id: 2, vector: [0.2, 0.1, 0.4], payload: { name: 'Red Fort', lat: 28.6562, lon: 77.2410 } },
  { id: 3, vector: [0.3, 0.4, 0.1], payload: { name: 'Qutub Minar', lat: 28.5244, lon: 77.1855 } },
];

async function main() {
  const store = new VectorStore({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collection: 'places',
    vectorSize: 3,
  });

  try {
    await store.init();
    console.log('✅ Collection ready');

    const res = await store.upsert(dummyPlaces);
    console.log(`✅ Inserted ${res.upserted} test vectors`);

    const searchRes = await store.search([0.1, 0.2, 0.3]);
    console.log('🔍 Search results:', searchRes);

  } catch (err) {
    console.error(err);
  }
}

main();

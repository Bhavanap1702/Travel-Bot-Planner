// src/controllers/planController.js
import { searchPOI } from "../services/vector_search.js";

export const generatePlanController = async (req, res) => {
  try {
    const { city, state, days = 1, budgetTier, interests } = req.body;

    if (!city && !state) {
      return res.status(400).json({ error: "At least city or state is required" });
    }

    const interestList = Array.isArray(interests) ? interests : interests ? [interests] : [];

    // Build query for Chroma
    const queryText = `${city ? city + ", " : ""}${state ? state + ", " : ""}${
      budgetTier ? budgetTier + " budget, " : ""
    }interests: ${interestList.join(", ")}`;

    // Query Chroma for top 50 results
    const results = await searchPOI(queryText, 50);

    let pois = [];
    if (results && results.documents?.length > 0) {
      pois = results.documents[0].map((doc, i) => ({
        description: doc,
        metadata: results.metadatas[0][i],
        score: results.distances ? results.distances[0][i] : null
      }));
    }

    // Split POIs across days, max 5 POIs per day
    const itinerary = [];
    for (let i = 0; i < days; i++) {
      const dayPOIs = pois.slice(i * 5, (i + 1) * 5); // max 5 per day
      itinerary.push({
        day: i + 1,
        visits: dayPOIs
      });
    }

    res.json({ success: true, plan: { city, state, days, itinerary } });
  } catch (err) {
    console.error("❌ Generate plan error:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
};

// src/services/llm.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateAnswer(query, pois) {
  const context = pois.length
    ? pois.map(p => `${p.name}: ${p.description}`).join("\n")
    : "No relevant POIs found.";

  const prompt = `You are a friendly travel assistant for India.
User question: ${query}
Relevant POIs:\n${context}
Give a helpful and engaging travel answer.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

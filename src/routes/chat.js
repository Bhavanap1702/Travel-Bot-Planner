// src/routes/chat.js
import { Router } from "express";
// This is a placeholder orchestrator. Extend with LLM + RAG integration.
const r = Router();

r.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    // naive echo response + instruction for structured JSON return
    const reply = `Demo echo: received ${messages?.length ?? 0} messages. Use /api/plan for planning.`;
    res.json({ text: reply, blocks: {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default r;

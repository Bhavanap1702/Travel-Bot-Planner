// server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import planRoutes from "./src/routes/planRoutes.js";
import { getOrCreateCollection } from "./src/services/vector_search.js";

dotenv.config();
const app = express();
app.use(express.json());

// ✅ Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files from "public"
app.use(express.static(path.join(__dirname, "public")));

// ----------------- MongoDB Connection -----------------
const mongoUri = process.env.MONGO_URI || process.env.MONGO_LOCAL_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// ----------------- Chroma Vector Collection -----------------
const COLLECTION_NAME = "pois";
getOrCreateCollection()
  .then(() => console.log(`✅ Chroma Collection '${COLLECTION_NAME}' ready`))
  .catch((err) => console.error("❌ Failed to create Chroma collection:", err));

// ----------------- Routes -----------------
app.use("/api", planRoutes);

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

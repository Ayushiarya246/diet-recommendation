// src/server.js
import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


// initialize models (important so that definitions run once)
import "./models/index.js"; // ensures models are created and associations set

import connection from "./postgres/postgres.js";


const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅


import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import predictionRoutes from "./routes/prediction.js";
import authMiddleware from "./middleware/authMiddleware.js";
// mount routes
app.use("/api/auth", authRoutes);
app.use("/api/health" ,authMiddleware, healthRoutes);
app.use("/api/predict",authMiddleware, predictionRoutes);

// test
app.get("/", (req, res) => res.send("Server works! 🚀"));

const PORT = Number(process.env.PORT || 8000);

connection()
  .then(() => app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`)))
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });

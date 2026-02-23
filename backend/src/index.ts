import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import fastingRoutes from "./routes/fasting";
import periodsRoutes from "./routes/periods";
import userRoutes from "./routes/user";

const app = express();

app.use(
  cors({
    origin: env.frontendOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", requireAuth, userRoutes);
app.use("/api/periods", requireAuth, periodsRoutes);
app.use("/api/fasting", requireAuth, fastingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
});

async function start() {
  try {
    await mongoose.connect(env.mongoUri);
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server");
    console.error(error);
    process.exit(1);
  }
}

void start();

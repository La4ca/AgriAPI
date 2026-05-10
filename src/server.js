import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import farmerRoutes from "./routes/farmers.js";
import supplyRequestRoutes from "./routes/supplyRequests.js";
import alertRoutes from "./routes/alerts.js";
import dashboardRoutes from "./routes/dashboard.js";
import mapRoutes from "./routes/map.js";
import priorityRoutes from "./routes/priority.js";
import transportationRoutes from "./routes/transportation.js";
import activityRoutes from "./routes/activity.js";
import mfaRoutes from "./routes/mfa.js";

dotenv.config();

const app = express();

// Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
// }));
// origin: (process.env.FRONTEND_URL || "http://localhost:5173",
//   app.use(express.json()));
// app.use(morgan("dev"));
FRONTEND_URL=https://agri-flow-f.vercel.app

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/supply-requests", supplyRequestRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/priority", priorityRoutes);
app.use("/api/transportation", transportationRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/mfa", mfaRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", app: "AgriFlow API" }),
);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () =>
      console.log(`🚀 AgriFlow API running on port ${PORT}`),
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

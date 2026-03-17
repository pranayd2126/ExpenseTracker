import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { seedDefaultCategories } from "./controllers/categoryController.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ai", aiRoutes);

async function connectDB() {
  try {
    const mongoUrl = process.env.MONGO_URL?.trim();
    if (!mongoUrl) {
      throw new Error("MONGO_URL is missing in backend/.env");
    }

    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("Connected to MongoDB");
    await seedDefaultCategories();
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    const sslErrorCode = error?.cause?.code || error?.code;
    if (sslErrorCode === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR") {
      console.error("Atlas TLS handshake failed. Check these:");
      console.error("1) Atlas Network Access includes your current IP");
      console.error("2) DB user credentials in MONGO_URL are correct");
      console.error("3) Antivirus/proxy is not intercepting TLS traffic");
      console.error("4) Try a mobile hotspot/VPN to rule out ISP/router filtering");
    }

    if (error?.code === 8000 || error?.codeName === "AtlasError") {
      console.error("Atlas authentication failed. Check these:");
      console.error("1) Username/password in MONGO_URL exactly match Atlas Database Access user");
      console.error("2) If password has special chars (@ : / ? #), URL-encode it");
      console.error("3) Ensure the DB user has at least readWrite role for your database");
      console.error("4) Use Atlas-generated connection string and replace only <username>/<password>");
    }
  }
}
connectDB();

// Error handlers
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed", errors: err.errors });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate field value" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});

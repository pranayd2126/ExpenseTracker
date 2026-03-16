import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();


import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenceRoutes.js";

const app = express();
app.use(cors());

app.use(cookieParser());

app.use(express.json());

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 5000}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectDB();

//routes
app.use("/users-api", userRoutes);
app.use("/expense-api", expenseRoutes);

function errorHandler(err, req, res, next) {
  res.json({ message: "error", reason: err.message });
}
app.use(errorHandler);

app.use((err, req, res, next) => {
  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors,
    });
  }
  // Invalid ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    });
  }
  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Duplicate field value",
    });
  }
  res.status(500).json({
    message: "Internal Server Error",
  });
});

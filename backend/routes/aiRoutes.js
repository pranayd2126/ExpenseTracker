import express from "express";
import multer from "multer";
import {
  scanReceipt,
  getAISuggestions,
  predictExpenses,
} from "../controllers/aiController.js";
import { protect } from "../middleware/verifyToken.js";

const router = express.Router();

// In-memory storage — no files written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are accepted for receipt scanning."), false);
    }
  },
});

// POST /api/ai/scan-receipt   — multipart image upload
router.post("/scan-receipt", protect, upload.single("receipt"), scanReceipt);

// GET  /api/ai/suggestions    — money-saving suggestions + prediction
router.get("/suggestions", protect, getAISuggestions);

// GET  /api/ai/predict        — next-month expense prediction only
router.get("/predict", protect, predictExpenses);

export default router;

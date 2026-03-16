import express from "express";
import {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getAnalytics,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/verifyToken.js";

const router = express.Router();

// All expense routes require authentication
router.post("/", protect, addTransaction);
router.get("/", protect, getAllTransactions);
router.get("/analytics", protect, getAnalytics);
router.get("/:id", protect, getTransactionById);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

export default router;

import express from "express";

import {
  addTransation,
  updateTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
} from "../controllers/expence-api.js";

import { protect } from "../middleware/verifyToken.js";
const router = express.Router();


router.post("/addTransation",protect, addTransation);

export default router;

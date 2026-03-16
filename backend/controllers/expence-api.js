import express from "express";

import TransationSchema from "../models/TransactionModel.js";
import categorySchema from "../models/categorySchema.js";

import cron from "node-cron";

cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();

    const recurringExpenses = await TransationSchema.find({
      isRecurring: true,
      nextRecurringDate: { $lte: today },
    });

    for (const exp of recurringExpenses) {
      await TransationSchema.create({
        userId: exp.userId,
        amount: exp.amount,
        type: "expense",
        category: exp.category,
        title: exp.title,
        description: exp.description,
        date: new Date(),
      });

      // move next recurring date to next month
      const nextDate = new Date(exp.nextRecurringDate);
      nextDate.setMonth(nextDate.getMonth() + 1);

      exp.nextRecurringDate = nextDate;
      await exp.save();
    }
  } catch (error) {
    console.error("Recurring transaction error:", error);
  }
});

export const addTransation = async (req, res) => {
  try {
    const { amount, category, type, date, title, description } = req.body;

    if (!amount || !category || !type || !date || !title) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount, category, type, date, title",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    const newTransaction = new TransationSchema({
      userId: req.userId,
      amount,
      category,
      type,
      date,
      title,
      description,
    });

    await newTransaction.save();

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: newTransaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding transaction",
      error: error.message,
    });
  }
};

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await TransationSchema.find({
      userId: req.userId,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};


export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await TransationSchema.findOneAndUpdate(
      { _id: id, userId: req.userId },
      req.body,
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating transaction",
      error: error.message,
    });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TransationSchema.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting transaction",
      error: error.message,
    });
  }
};


export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await TransationSchema.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};
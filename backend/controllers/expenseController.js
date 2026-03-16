import Transaction from "../models/TransactionModel.js";
import cron from "node-cron";
import { invalidateUserAICache } from "./aiController.js";

// Daily cron: auto-create due recurring transactions
cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();

    const recurringExpenses = await Transaction.find({
      isRecurring: true,
      nextRecurringDate: { $lte: today },
      $or: [
        { recurringEndDate: null },
        { recurringEndDate: { $gte: today } },
      ],
    });

    for (const exp of recurringExpenses) {
      await Transaction.create({
        userId: exp.userId,
        amount: exp.amount,
        type: exp.type,
        category: exp.category,
        title: exp.title,
        note: exp.note,
        date: new Date(),
        isRecurring: false, // generated copy is not itself recurring
      });

      // Advance nextRecurringDate
      const nextDate = new Date(exp.nextRecurringDate);
      if (exp.recurringInterval === "weekly") {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (exp.recurringInterval === "monthly") {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (exp.recurringInterval === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      exp.nextRecurringDate = nextDate;
      await exp.save();
    }

    console.log(`Recurring cron: processed ${recurringExpenses.length} transactions`);
  } catch (error) {
    console.error("Recurring transaction cron error:", error);
  }
});

export const addTransaction = async (req, res) => {
  try {
    const { amount, category, type, date, title, note, isRecurring, recurringInterval, recurringEndDate } = req.body;

    if (!amount || !category || !type || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide amount, category, type, and date.",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    const safeTitle = title?.trim() || `${type === "income" ? "Income" : "Expense"} entry`;

    const txData = {
      userId: req.userId,
      amount: parseFloat(amount),
      category,
      type,
      date: new Date(date),
      title: safeTitle,
      note: note?.trim() || "",
    };

    if (isRecurring) {
      if (!recurringInterval) {
        return res.status(400).json({
          success: false,
          message: "recurringInterval is required for recurring transactions",
        });
      }
      txData.isRecurring = true;
      txData.recurringInterval = recurringInterval;
      txData.recurringEndDate = recurringEndDate || null;

      // Set first nextRecurringDate
      const startDate = new Date(date);
      if (recurringInterval === "weekly") {
        startDate.setDate(startDate.getDate() + 7);
      } else if (recurringInterval === "monthly") {
        startDate.setMonth(startDate.getMonth() + 1);
      } else if (recurringInterval === "yearly") {
        startDate.setFullYear(startDate.getFullYear() + 1);
      }
      txData.nextRecurringDate = startDate;
    }

    const newTransaction = await Transaction.create(txData);
    await invalidateUserAICache(req.userId);

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
    const { type, category, startDate, endDate } = req.query;
    const filter = { userId: req.userId };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("category", "name type")
      .sort({ date: -1 });

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

export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate("category", "name type");

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching transaction",
      error: error.message,
    });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    await invalidateUserAICache(req.userId);

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
    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    await invalidateUserAICache(req.userId);

    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting transaction",
      error: error.message,
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { userId: req.userId };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const transactions = await Transaction.find(filter).populate("category", "name type");

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Category totals
    const categoryMap = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const catName = t.category?.name || "Uncategorized";
        categoryMap[catName] = (categoryMap[catName] || 0) + t.amount;
      });

    const categoryTotals = Object.entries(categoryMap).map(([categoryName, totalAmount]) => ({
      categoryName,
      totalAmount,
    }));

    // Monthly totals
    const monthlyMap = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { _id: { month: d.getMonth() + 1, year: d.getFullYear() }, income: 0, expense: 0 };
      }
      monthlyMap[key][t.type] += t.amount;
    });

    const monthlyTotals = Object.values(monthlyMap).sort(
      (a, b) => a._id.year - b._id.year || a._id.month - b._id.month,
    );

    res.status(200).json({
      success: true,
      data: {
        income,
        expense,
        balance: income - expense,
        categoryTotals,
        monthlyTotals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

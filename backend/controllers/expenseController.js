import Transaction from "../models/TransactionModel.js";
import cron from "node-cron";
import { invalidateUserAICache } from "./aiController.js";

// --- 1. CRON JOB: Recurring Transactions (Daily at Midnight) ---
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
        isRecurring: false, 
      });

      const nextDate = new Date(exp.nextRecurringDate);
      if (exp.recurringInterval === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (exp.recurringInterval === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (exp.recurringInterval === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);

      exp.nextRecurringDate = nextDate;
      await exp.save();
    }
    console.log(`Recurring cron: processed ${recurringExpenses.length} transactions`);
  } catch (error) {
    console.error("Recurring transaction cron error:", error);
  }
});

// --- 2. GET ALL TRANSACTIONS (REPORTS PAGE) ---
export const getAllTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, sort, month, year } = req.query;
    const filter = { userId: req.userId };

    if (type && type !== "all") filter.type = type;
    if (category && category !== "all") filter.category = category;

    // Fixed Date Filter: Handles Full Year or Specific Month
    if (year) {
      let start, end;
      if (month && month !== "") {
        // Specific Month
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59);
      } else {
        // Full Year (Jan 1 to Dec 31)
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59);
      }
      filter.date = { $gte: start, $lte: end };
    } 
    else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Dynamic Sort: Latest (-date) or Oldest (date)
    const sortOption = sort || "-date";

    const transactions = await Transaction.find(filter)
      .populate("category", "name type")
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 3. ADD TRANSACTION ---
export const addTransaction = async (req, res) => {
  try {
    const { amount, category, type, date, title, note, isRecurring, recurringInterval, recurringEndDate } = req.body;

    const txData = {
      userId: req.userId,
      amount: parseFloat(amount),
      category,
      type,
      date: new Date(date),
      title: title?.trim() || `${type} entry`,
      note: note?.trim() || "",
    };

    if (isRecurring) {
      txData.isRecurring = true;
      txData.recurringInterval = recurringInterval;
      txData.recurringEndDate = recurringEndDate || null;
      
      const next = new Date(date);
      if (recurringInterval === "weekly") next.setDate(next.getDate() + 7);
      else if (recurringInterval === "monthly") next.setMonth(next.getMonth() + 1);
      else if (recurringInterval === "yearly") next.setFullYear(next.getFullYear() + 1);
      txData.nextRecurringDate = next;
    }

    const newTransaction = await Transaction.create(txData);
    await invalidateUserAICache(req.userId);

    res.status(201).json({ success: true, data: newTransaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 4. UPDATE TRANSACTION ---
export const updateTransaction = async (req, res) => {
  try {
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).populate("category", "name type");

    if (!updated) return res.status(404).json({ success: false, message: "Not found" });

    await invalidateUserAICache(req.userId);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 5. DELETE TRANSACTION ---
export const deleteTransaction = async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

    await invalidateUserAICache(req.userId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 6. DASHBOARD ANALYTICS ---
export const getAnalytics = async (req, res) => {
  try {
    const { timeframe, month, year } = req.query;
    const filter = { userId: req.userId };

    const now = new Date();
    if (timeframe === 'day') {
      filter.date = { $gte: new Date(now.setHours(0,0,0,0)) };
    } else if (timeframe === 'week') {
      const start = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
      filter.date = { $gte: start.setHours(0,0,0,0) };
    } else if (timeframe === 'month' || (month && year)) {
      const m = month || (now.getMonth() + 1);
      const y = year || now.getFullYear();
      filter.date = { $gte: new Date(y, m - 1, 1), $lte: new Date(y, m, 0, 23, 59, 59) };
    } else if (timeframe === 'year') {
      filter.date = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    const transactions = await Transaction.find(filter).populate("category", "name type");

    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const categoryMap = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || "Uncategorized";
      categoryMap[name] = (categoryMap[name] || 0) + t.amount;
    });

    const monthlyMap = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { _id: { month: d.getMonth() + 1, year: d.getFullYear() }, income: 0, expense: 0 };
      }
      monthlyMap[key][t.type] += t.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        income,
        expense,
        balance: income - expense,
        categoryTotals: Object.entries(categoryMap).map(([categoryName, totalAmount]) => ({ categoryName, totalAmount })),
        monthlyTotals: Object.values(monthlyMap).sort((a,b) => a._id.year - b._id.year || a._id.month - b._id.month),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// --- 7. GET BY ID ---
export const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId }).populate("category", "name type");
    if (!transaction) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
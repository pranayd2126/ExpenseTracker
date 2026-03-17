import Transaction from "../models/TransactionModel.js";
import mongoose from "mongoose";
import cron from "node-cron";
import { invalidateUserAICache } from "./aiController.js";

const VALID_INTERVALS = new Set(["weekly", "monthly", "yearly"]);

const addIntervalToDate = (date, interval) => {
  const next = new Date(date);
  if (interval === "weekly") next.setDate(next.getDate() + 7);
  else if (interval === "monthly") next.setMonth(next.getMonth() + 1);
  else if (interval === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const isFutureDate = (value) => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return value.getTime() > endOfToday.getTime();
};

const toNullableDate = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : "invalid";
};

const buildRecurringSeriesDocs = ({
  baseData,
  startDate,
  endDate,
  recurringInterval,
  recurringGroupId,
}) => {
  const docs = [];
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    docs.push({
      ...baseData,
      date: new Date(cursor),
      isRecurring: false,
      recurringInterval,
      recurringEndDate: new Date(endDate),
      nextRecurringDate: null,
      recurringGroupId,
    });
    cursor = addIntervalToDate(cursor, recurringInterval);
  }

  return docs;
};

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
      if (!VALID_INTERVALS.has(exp.recurringInterval)) {
        exp.isRecurring = false;
        await exp.save();
        continue;
      }

      let dueDate = new Date(exp.nextRecurringDate);
      const endDate = exp.recurringEndDate ? new Date(exp.recurringEndDate) : null;

      while (
        dueDate <= today &&
        (!endDate || dueDate <= endDate)
      ) {
        await Transaction.create({
          userId: exp.userId,
          amount: exp.amount,
          type: exp.type,
          category: exp.category,
          title: exp.title,
          note: exp.note,
          date: new Date(dueDate),
          isRecurring: false,
          recurringInterval: exp.recurringInterval,
          recurringEndDate: exp.recurringEndDate || null,
          recurringGroupId: exp.recurringGroupId || null,
        });

        dueDate = addIntervalToDate(dueDate, exp.recurringInterval);
      }

      exp.nextRecurringDate = dueDate;

      if (endDate && dueDate > endDate) {
        exp.isRecurring = false;
      }

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

    // Dynamic Sort: Latest (-date) or Oldest (date), with createdAt as tie-breaker within same date
    const dateSort = sort === "date" ? 1 : -1;
    const createdAtSort = sort === "date" ? 1 : -1;

    const transactions = await Transaction.find(filter)
      .populate("category", "name type")
      .sort({ date: dateSort, createdAt: createdAtSort });

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
    const baseDate = new Date(date);

    if (!isValidDate(baseDate)) {
      return res.status(400).json({ success: false, message: "Invalid transaction date" });
    }

    if (isFutureDate(baseDate)) {
      return res.status(400).json({ success: false, message: "Transaction date cannot be in the future" });
    }

    const txData = {
      userId: req.userId,
      amount: parseFloat(amount),
      category,
      type,
      date: baseDate,
      title: title?.trim() || `${type} entry`,
      note: note?.trim() || "",
    };

    if (isRecurring) {
      if (!VALID_INTERVALS.has(recurringInterval)) {
        return res.status(400).json({ success: false, message: "Recurring interval is required" });
      }

      const endDate = recurringEndDate ? new Date(recurringEndDate) : null;
      if (endDate && !isValidDate(endDate)) {
        return res.status(400).json({ success: false, message: "Invalid recurring end date" });
      }

      if (endDate && isFutureDate(endDate)) {
        return res.status(400).json({ success: false, message: "Recurring end date cannot be in the future" });
      }

      if (endDate && endDate < baseDate) {
        return res.status(400).json({ success: false, message: "Recurring end date must be on or after start date" });
      }

      const recurringGroupId = new mongoose.Types.ObjectId().toString();

      // If end date is provided, pre-generate all occurrences so users can see the full schedule instantly.
      if (endDate) {
        const docs = buildRecurringSeriesDocs({
          baseData: txData,
          startDate: baseDate,
          endDate,
          recurringInterval,
          recurringGroupId,
        });

        const createdTransactions = await Transaction.insertMany(docs);
        await invalidateUserAICache(req.userId);

        return res.status(201).json({
          success: true,
          data: createdTransactions[0],
          count: createdTransactions.length,
          message: `Created ${createdTransactions.length} recurring transactions up to end date`,
        });
      }

      // For open-ended recurring transactions, keep cron-based generation.
      txData.isRecurring = true;
      txData.recurringInterval = recurringInterval;
      txData.recurringEndDate = null;
      txData.nextRecurringDate = addIntervalToDate(baseDate, recurringInterval);
      txData.recurringGroupId = recurringGroupId;
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
    const existing = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    const has = (key) => Object.prototype.hasOwnProperty.call(req.body, key);
    const parsedDate = has("date") ? new Date(req.body.date) : undefined;
    if (parsedDate && !isValidDate(parsedDate)) {
      return res.status(400).json({ success: false, message: "Invalid transaction date" });
    }

    if (parsedDate && isFutureDate(parsedDate)) {
      return res.status(400).json({ success: false, message: "Transaction date cannot be in the future" });
    }

    const parsedEndDate = toNullableDate(req.body.recurringEndDate);
    if (parsedEndDate === "invalid") {
      return res.status(400).json({ success: false, message: "Invalid recurring end date" });
    }

    if (parsedEndDate && isFutureDate(parsedEndDate)) {
      return res.status(400).json({ success: false, message: "Recurring end date cannot be in the future" });
    }

    const updateDoc = {
      ...req.body,
    };

    if (has("amount")) updateDoc.amount = parseFloat(req.body.amount);
    if (has("title")) updateDoc.title = req.body.title?.trim() || `${req.body.type || existing.type} entry`;
    if (has("note")) updateDoc.note = req.body.note?.trim() || "";
    if (parsedDate) updateDoc.date = parsedDate;

    const shouldTreatAsRecurring =
      (has("isRecurring") ? Boolean(req.body.isRecurring) : false) ||
      Boolean(existing.isRecurring) ||
      Boolean(existing.recurringGroupId);

    const hasRecurringEdit =
      has("isRecurring") ||
      has("recurringInterval") ||
      has("recurringEndDate") ||
      Boolean(existing.recurringGroupId);

    if (shouldTreatAsRecurring && hasRecurringEdit) {
      if (has("isRecurring") && !req.body.isRecurring) {
        if (existing.recurringGroupId) {
          await Transaction.deleteMany({
            userId: req.userId,
            recurringGroupId: existing.recurringGroupId,
            _id: { $ne: existing._id },
            date: { $gte: existing.date },
          });
        }

        existing.amount = has("amount") ? updateDoc.amount : existing.amount;
        existing.category = has("category") ? req.body.category : existing.category;
        existing.type = has("type") ? req.body.type : existing.type;
        existing.title = has("title") ? updateDoc.title : existing.title;
        existing.note = has("note") ? updateDoc.note : existing.note;
        existing.date = parsedDate || existing.date;
        existing.isRecurring = false;
        existing.recurringInterval = undefined;
        existing.recurringEndDate = null;
        existing.nextRecurringDate = null;
        existing.recurringGroupId = null;

        await existing.save();
        const updated = await Transaction.findById(existing._id).populate("category", "name type");

        await invalidateUserAICache(req.userId);
        return res.status(200).json({ success: true, data: updated });
      }

      const recurringInterval = has("recurringInterval") ? req.body.recurringInterval : existing.recurringInterval;
      if (!VALID_INTERVALS.has(recurringInterval)) {
        return res.status(400).json({ success: false, message: "Recurring interval is required" });
      }

      const recurringGroupId = existing.recurringGroupId || new mongoose.Types.ObjectId().toString();
      const seriesStartTx = await Transaction.findOne({ userId: req.userId, recurringGroupId }).sort({ date: 1 });
      const startDate = parsedDate || seriesStartTx?.date || existing.date;
      const endDate = parsedEndDate !== undefined ? parsedEndDate : existing.recurringEndDate;

      if (endDate && endDate < startDate) {
        return res.status(400).json({ success: false, message: "Recurring end date must be on or after start date" });
      }

      const baseData = {
        userId: req.userId,
        amount: has("amount") ? updateDoc.amount : existing.amount,
        category: has("category") ? req.body.category : existing.category,
        type: has("type") ? req.body.type : existing.type,
        title: has("title") ? updateDoc.title : existing.title,
        note: has("note") ? updateDoc.note : existing.note,
      };

      if (endDate) {
        const docs = buildRecurringSeriesDocs({
          baseData,
          startDate,
          endDate,
          recurringInterval,
          recurringGroupId,
        });

        await Transaction.deleteMany({ userId: req.userId, recurringGroupId });
        const createdTransactions = await Transaction.insertMany(docs);
        const updated = await Transaction.findById(createdTransactions[0]._id).populate("category", "name type");

        await invalidateUserAICache(req.userId);
        return res.status(200).json({
          success: true,
          data: updated,
          count: createdTransactions.length,
          message: `Recurring series updated with ${createdTransactions.length} scheduled transactions`,
        });
      }

      // Open-ended recurring: keep one template transaction and let cron generate future occurrences.
      await Transaction.deleteMany({
        userId: req.userId,
        recurringGroupId,
        _id: { $ne: existing._id },
        date: { $gte: startDate },
      });

      existing.amount = baseData.amount;
      existing.category = baseData.category;
      existing.type = baseData.type;
      existing.title = baseData.title;
      existing.note = baseData.note;
      existing.date = startDate;
      existing.isRecurring = true;
      existing.recurringInterval = recurringInterval;
      existing.recurringEndDate = null;
      existing.nextRecurringDate = addIntervalToDate(startDate, recurringInterval);
      existing.recurringGroupId = recurringGroupId;

      await existing.save();
      const updated = await Transaction.findById(existing._id).populate("category", "name type");

      await invalidateUserAICache(req.userId);
      return res.status(200).json({ success: true, data: updated });
    }

    if (has("isRecurring") && !req.body.isRecurring) {
      updateDoc.isRecurring = false;
      updateDoc.recurringInterval = undefined;
      updateDoc.recurringEndDate = null;
      updateDoc.nextRecurringDate = null;
      updateDoc.recurringGroupId = null;
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateDoc,
      { new: true, runValidators: true }
    ).populate("category", "name type");

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
    const { timeframe, year, month } = req.query;
    const filter = { userId: req.userId };

    const now = new Date();
    const parsedYear = Number(year);
    const parsedMonth = Number(month);
    const hasYear = Number.isInteger(parsedYear) && parsedYear > 1900;
    const hasMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12;
    let start;
    let end;

    if (timeframe === "day") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (timeframe === "week") {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      start = new Date(now);
      start.setDate(now.getDate() + mondayOffset);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === "year") {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (timeframe === "history" && hasYear) {
      if (hasMonth) {
        start = new Date(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0);
        end = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
      } else {
        start = new Date(parsedYear, 0, 1, 0, 0, 0, 0);
        end = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
      }
    } else {
      // Default to current month when timeframe is missing or "month".
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    filter.date = { $gte: start, $lte: end };

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
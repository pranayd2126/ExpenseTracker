import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import User from "../models/UserModel.js";
import Category from "../models/categorySchema.js";
import Transaction from "../models/TransactionModel.js";

export const register = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Server error during registration" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is blocked" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        token,
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        incomeMode: user.incomeMode,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
  res.status(200).json({ success: true, message: "User logged out successfully" });
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: false });
    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Server error while changing password" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, incomeMode, defaultSalary, country, region, currencyCode, theme } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Email is intentionally excluded — it cannot be changed after registration
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (incomeMode !== undefined) user.incomeMode = incomeMode;
    if (defaultSalary !== undefined) user.defaultSalary = defaultSalary;
    if (country !== undefined) user.country = country;
    if (region !== undefined) user.region = region;
    if (currencyCode !== undefined) user.currencyCode = String(currencyCode).toUpperCase();
    if (theme !== undefined) user.theme = theme;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating profile" });
  }
};

// ─── Helper: flatten transactions for tabular export ──────────────────────────
function flattenTransactions(transactions) {
  return transactions.map((t) => ({
    Date: t.date ? new Date(t.date).toLocaleDateString("en-IN") : "",
    Title: t.title || "",
    Type: t.type || "",
    Category: t.category?.name || "",
    Amount: t.amount ?? 0,
    Note: t.note || "",
  }));
}

// ─── Export: JSON ─────────────────────────────────────────────────────────────
function sendJSON(res, user, categories, transactions, safeName) {
  const backupPayload = {
    exportedAt: new Date().toISOString(),
    profile: user,
    categories,
    transactions,
  };
  const fileName = `expense-tracker-backup-${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(JSON.stringify(backupPayload, null, 2));
}

// ─── Export: CSV ──────────────────────────────────────────────────────────────
function sendCSV(res, transactions, safeName) {
  const rows = flattenTransactions(transactions);
  const headers = ["Date", "Title", "Type", "Category", "Amount", "Note"];

  const escape = (val) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  let csv = headers.join(",") + "\n";
  for (const row of rows) {
    csv += headers.map((h) => escape(row[h])).join(",") + "\n";
  }

  const fileName = `expense-tracker-${safeName}-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  return res.status(200).send(csv);
}

// ─── Export: Excel ────────────────────────────────────────────────────────────
async function sendExcel(res, transactions, safeName) {
  const rows = flattenTransactions(transactions);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ExpenseTracker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Transactions");
  sheet.columns = [
    { header: "Date", key: "Date", width: 14 },
    { header: "Title", key: "Title", width: 28 },
    { header: "Type", key: "Type", width: 10 },
    { header: "Category", key: "Category", width: 18 },
    { header: "Amount", key: "Amount", width: 14 },
    { header: "Note", key: "Note", width: 30 },
  ];

  // Style the header row
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };

  rows.forEach((row) => sheet.addRow(row));

  const fileName = `expense-tracker-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  await workbook.xlsx.write(res);
  return res.end();
}

// ─── Export: PDF ──────────────────────────────────────────────────────────────
function sendPDF(res, user, transactions, safeName) {
  const rows = flattenTransactions(transactions);
  const fileName = `expense-tracker-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // Title
  doc.fontSize(18).fillColor("#1e293b").text("Expense Tracker Report", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#64748b").text(
    `${user.firstName || ""} ${user.lastName || ""} — ${user.email} — Exported ${new Date().toLocaleDateString("en-IN")}`,
    { align: "center" },
  );
  doc.moveDown(1);

  // Summary
  const totalIncome = rows.filter((r) => r.Type === "income").reduce((s, r) => s + Number(r.Amount), 0);
  const totalExpense = rows.filter((r) => r.Type === "expense").reduce((s, r) => s + Number(r.Amount), 0);

  doc.fontSize(11).fillColor("#0f172a");
  doc.text(`Total Income: ${totalIncome.toLocaleString("en-IN")}`, { continued: true });
  doc.text(`    |    Total Expense: ${totalExpense.toLocaleString("en-IN")}`, { continued: true });
  doc.text(`    |    Net: ${(totalIncome - totalExpense).toLocaleString("en-IN")}`);
  doc.moveDown(1);

  // Table header
  const colX = [40, 110, 260, 320, 390, 460];
  const headers = ["Date", "Title", "Type", "Category", "Amount", "Note"];
  doc.fontSize(9).fillColor("#ffffff");
  const headerY = doc.y;
  doc.rect(38, headerY - 2, 520, 18).fill("#334155");
  doc.fillColor("#ffffff");
  headers.forEach((h, i) => doc.text(h, colX[i], headerY + 2, { width: 80 }));
  doc.y = headerY + 20;

  // Table rows
  doc.fillColor("#1e293b").fontSize(8);
  rows.forEach((row, idx) => {
    if (doc.y > 750) {
      doc.addPage();
      doc.y = 40;
    }
    const y = doc.y;
    if (idx % 2 === 0) {
      doc.rect(38, y - 2, 520, 16).fill("#f1f5f9");
      doc.fillColor("#1e293b");
    }
    doc.text(row.Date, colX[0], y, { width: 70 });
    doc.text(String(row.Title).substring(0, 22), colX[1], y, { width: 150 });
    doc.text(row.Type, colX[2], y, { width: 55 });
    doc.text(String(row.Category).substring(0, 14), colX[3], y, { width: 70 });
    doc.text(String(row.Amount), colX[4], y, { width: 65 });
    doc.text(String(row.Note).substring(0, 18), colX[5], y, { width: 100 });
    doc.y = y + 16;
  });

  doc.end();
}

// ─── Main export handler ──────────────────────────────────────────────────────
export const exportBackup = async (req, res) => {
  try {
    const format = (req.query.format || "json").toLowerCase();
    const validFormats = ["json", "csv", "pdf", "excel"];
    if (!validFormats.includes(format)) {
      return res.status(400).json({ success: false, message: `Invalid format. Choose from: ${validFormats.join(", ")}` });
    }

    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [categories, transactions] = await Promise.all([
      Category.find({ $or: [{ isDefault: true }, { userId: req.userId }] }).lean(),
      Transaction.find({ userId: req.userId }).populate("category", "name type").lean(),
    ]);

    const safeName = String(user.firstName || "user").replace(/\s+/g, "-").toLowerCase();

    switch (format) {
      case "csv":
        return sendCSV(res, transactions, safeName);
      case "pdf":
        return sendPDF(res, user, transactions, safeName);
      case "excel":
        return await sendExcel(res, transactions, safeName);
      default:
        return sendJSON(res, user, categories, transactions, safeName);
    }
  } catch (error) {
    console.error("Export backup error:", error);
    return res.status(500).json({ success: false, message: "Error exporting backup" });
  }
};

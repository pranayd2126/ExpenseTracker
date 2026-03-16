import OpenAI from "openai";
import Transaction from "../models/TransactionModel.js";
import Category from "../models/categorySchema.js";

// ─── Two separate LLM clients (plug in your own keys/endpoints) ───────────────

function inferBaseUrl(apiKey, explicitBaseUrl) {
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  if (!apiKey) {
    return undefined;
  }

  // Groq uses OpenAI-compatible APIs with gsk_ keys.
  if (apiKey.startsWith("gsk_")) {
    return "https://api.groq.com/openai/v1";
  }

  // OpenRouter commonly uses sk-or- keys.
  if (apiKey.startsWith("sk-or-")) {
    return "https://openrouter.ai/api/v1";
  }

  return undefined;
}

function createClient(apiKey, explicitBaseUrl) {
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    ...(inferBaseUrl(apiKey, explicitBaseUrl) && {
      baseURL: inferBaseUrl(apiKey, explicitBaseUrl),
    }),
  });
}

function getVisionClient() {
  return createClient(
    process.env.VISION_LLM_API_KEY || process.env.AI_API_KEY,
    process.env.VISION_LLM_BASE_URL,
  );
}

function getTextClient() {
  return createClient(
    process.env.TEXT_LLM_API_KEY || process.env.AI_API_KEY,
    process.env.TEXT_LLM_BASE_URL,
  );
}

function extractMessageText(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item?.type === "text") {
          return item.text || "";
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

// ─── Helper: strip markdown code fences from LLM output ──────────────────────
function parseJSON(raw) {
  const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

// ─── Receipt Scanning ─────────────────────────────────────────────────────────
export const scanReceipt = async (req, res) => {
  try {
    const visionClient = getVisionClient();

    if (!visionClient) {
      return res.status(500).json({
        success: false,
        message: "Receipt scanning AI is not configured on the server.",
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded." });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    // Build category list so the LLM can suggest a matching one
    const categories = await Category.find({
      $or: [{ isDefault: true }, { userId: req.userId }],
    });
    const categoryList = categories
      .map((c) => `${c._id}:${c.name}(${c.type})`)
      .join(", ");

    const prompt = `You are a receipt-reading AI. Analyze this image carefully.

STEP 1 – Image quality check:
- Is the image blurred, too dark, too bright, partially obscured, or otherwise unreadable?

If YES (unreadable), respond ONLY with this JSON:
{"status":"unreadable","reason":"<one short sentence explaining why it is unreadable>"}

If NO (readable), extract all transaction info and respond ONLY with this JSON:
{
  "status": "success",
  "data": {
    "title": "<merchant or store name, or a short description>",
    "amount": <total amount as a number, no currency symbol>,
    "type": "<expense or income>",
    "date": "<date in YYYY-MM-DD format; use today's date if not visible>",
    "note": "<brief summary of items or purpose>",
    "suggestedCategoryId": "<pick the single best matching ID from: ${categoryList}>",
    "suggestedCategoryName": "<corresponding category name>"
  }
}

Rules:
- Return ONLY the JSON object — no extra text, no markdown.
- If no total amount is clearly visible, set "status":"unreadable" and explain.`;

    const response = await visionClient.chat.completions.create({
      model: process.env.VISION_LLM_MODEL || "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const raw = extractMessageText(response.choices[0]?.message?.content);

    let parsed;
    try {
      parsed = parseJSON(raw);
    } catch {
      return res.status(500).json({
        success: false,
        message: "AI returned an unexpected response. Please try again.",
      });
    }

    if (parsed.status === "unreadable") {
      return res.status(422).json({
        success: false,
        message: `Receipt image is unclear — ${parsed.reason}. Please upload a clearer photo.`,
        reason: parsed.reason,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receipt scanned successfully.",
      data: parsed.data,
    });
  } catch (error) {
    console.error("Receipt scan error:", error);
    res.status(500).json({
      success: false,
      message: "Error scanning receipt. Please try again.",
      error: error.message,
    });
  }
};

// ─── AI Suggestions ───────────────────────────────────────────────────────────
export const getAISuggestions = async (req, res) => {
  try {
    const textClient = getTextClient();

    if (!textClient) {
      return res.status(500).json({
        success: false,
        message: "Suggestion AI is not configured on the server.",
      });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId: req.userId,
      date: { $gte: threeMonthsAgo },
    }).populate("category", "name type");

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          suggestion: "Add some transactions first to get personalized AI suggestions.",
          tips: [],
          totalIncome: 0,
          totalExpense: 0,
          prediction: null,
        },
      });
    }

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    const catMap = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const name = t.category?.name || "Other";
        catMap[name] = (catMap[name] || 0) + t.amount;
      });

    const spendingSummary = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`)
      .join(", ");

    const savingsRate =
      totalIncome > 0
        ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)
        : 0;

    const prompt = `You are a personal finance advisor for an Indian user. Analyze their last 3 months of spending and give actionable advice.

Financial Summary (last 3 months):
- Total Income: ₹${totalIncome.toFixed(0)}
- Total Expenses: ₹${totalExpense.toFixed(0)}
- Savings Rate: ${savingsRate}%
- Spending by category: ${spendingSummary}

Respond ONLY with this JSON (no markdown, no extra text):
{
  "suggestion": "<one key observation about their overall spending pattern>",
  "tips": ["<specific actionable tip 1>", "<specific actionable tip 2>", "<specific actionable tip 3>"],
  "savingsGoal": "<suggested monthly savings target as a string like ₹5,000>",
  "highestSpendCategory": "<category name where they spend the most>",
  "prediction": <predicted total expense for NEXT MONTH as a plain number>
}`;

    const response = await textClient.chat.completions.create({
      model: process.env.TEXT_LLM_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 700,
    });

    const raw = extractMessageText(response.choices[0]?.message?.content);

    let aiData;
    try {
      aiData = parseJSON(raw);
    } catch {
      aiData = { suggestion: raw, tips: [] };
    }

    return res.status(200).json({
      success: true,
      data: { ...aiData, totalIncome, totalExpense },
    });
  } catch (error) {
    console.error("AI suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching AI suggestions.",
      error: error.message,
    });
  }
};

// ─── Expense Prediction ───────────────────────────────────────────────────────
export const predictExpenses = async (req, res) => {
  try {
    const textClient = getTextClient();

    if (!textClient) {
      return res.status(500).json({
        success: false,
        message: "Prediction AI is not configured on the server.",
      });
    }

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      userId: req.userId,
      type: "expense",
      date: { $gte: sixMonthsAgo },
    });

    if (transactions.length < 5) {
      return res.status(200).json({
        success: true,
        data: {
          message:
            "Not enough data to predict. Add more transactions for accurate predictions.",
          predictedTotal: null,
          trend: null,
        },
      });
    }

    const monthlyTotals = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + t.amount;
    });

    const historySummary = Object.entries(monthlyTotals)
      .sort()
      .map(([month, amt]) => `${month}: ₹${amt.toFixed(0)}`)
      .join(", ");

    const prompt = `Based on this monthly expense history for an Indian user: ${historySummary}

Predict total expense for next month. Respond ONLY with this JSON (no markdown, no extra text):
{
  "predictedTotal": <number>,
  "trend": "<increasing|decreasing|stable>",
  "confidence": "<low|medium|high>",
  "message": "<one sentence explaining the prediction>"
}`;

    const response = await textClient.chat.completions.create({
      model: process.env.TEXT_LLM_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 250,
    });

    const raw = extractMessageText(response.choices[0]?.message?.content);

    let prediction;
    try {
      prediction = parseJSON(raw);
    } catch {
      prediction = { message: raw };
    }

    return res.status(200).json({ success: true, data: prediction });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(500).json({
      success: false,
      message: "Error predicting expenses.",
      error: error.message,
    });
  }
};

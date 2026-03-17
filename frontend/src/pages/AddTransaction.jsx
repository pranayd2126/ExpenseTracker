// src/pages/AddTransaction.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getCategories, addTransaction } from "../services/api";
import ReceiptScanner from "../components/ReceiptScanner";

const AddTransaction = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [categories, setCategories] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    title: "",
    note: "",
    date: today,
    isRecurring: false,
    recurringInterval: "",
    recurringEndDate: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!form.category) return;
    const selected = categories.find((category) => category._id === form.category);
    if (selected && selected.type !== form.type) {
      setForm((prev) => ({ ...prev, category: "" }));
    }
  }, [form.type, form.category, categories]);

  const fetchCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data.categories);
    } catch (err) {
      toast.error("Failed to load categories");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleExtracted = (extracted) => {
    setForm((prev) => ({
      ...prev,
      title: extracted.title || prev.title,
      amount: extracted.amount || prev.amount,
      type: extracted.type || prev.type,
      category: extracted.suggestedCategoryId || prev.category,
      note: extracted.note || prev.note,
      date: extracted.date || prev.date,
    }));
    setShowScanner(false);
    setScannerKey((k) => k + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

      // Validate required fields
      if (!form.amount || form.amount <= 0) {
        toast.error("Please enter a valid amount");
        setIsSubmitting(false);
        return;
      }

      if (!form.category) {
        toast.error("Please select a category");
        setIsSubmitting(false);
        return;
      }

      if (form.date > today) {
        toast.error("Transaction date cannot be in the future");
        setIsSubmitting(false);
        return;
      }

      if (form.recurringEndDate && form.recurringEndDate > today) {
        toast.error("Recurring end date cannot be in the future");
        setIsSubmitting(false);
        return;
      }

      try {
      const payload = {
        ...form,
          title: form.title?.trim() || "",
          amount: parseFloat(form.amount),
        recurringEndDate: form.recurringEndDate === "" ? null : form.recurringEndDate
      };

      await addTransaction(payload);
      
        toast.success(`${form.type === "income" ? "💰 Income" : "🛒 Expense"} added successfully!`);

      // Reset form
      setForm((prev) => ({
        ...prev,
        amount: "",
        category: "",
        title: "",
        note: "",
        date: today,
        isRecurring: false,
        recurringInterval: "",
        recurringEndDate: ""
      }));

      // Navigate to dashboard after 1.5 seconds to see the new transaction
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error adding transaction";
      toast.error(errorMsg);
      console.error("Transaction error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((category) => category.type === form.type);

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowScanner((v) => !v)}
          className="w-full flex items-center justify-center gap-2 border border-blue-400 text-blue-600 py-2 rounded-lg text-sm hover:bg-blue-50 transition"
        >
          📷 {showScanner ? "Hide Receipt Scanner" : "Scan Receipt with AI"}
        </button>
        {showScanner && (
          <div className="mt-3">
            <ReceiptScanner key={scannerKey} onExtracted={handleExtracted} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          step="0.01"
          min="0"
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category (required)</option>
          {filteredCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title (optional, e.g., Salary, Groceries)"
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Note (optional)"
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          max={today}
          className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Recurring */}
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={handleChange}
            />
            <span>Recurring Transaction</span>
          </label>

          {form.isRecurring && (
            <div className="space-y-2">
              {/* Interval */}
              <select
                name="recurringInterval"
                value={form.recurringInterval}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select Interval</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>

              {/* End Date */}
              <label className="block text-gray-700">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="recurringEndDate"
                value={form.recurringEndDate}
                onChange={handleChange}
                max={today}
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                If end date is set, all recurring entries are auto-created up to that date.
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? "Adding..." : "Add Transaction"}
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
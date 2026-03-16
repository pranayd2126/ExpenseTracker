// src/pages/AddTransaction.jsx
import React, { useEffect, useState } from "react";
import { getCategories, addTransaction } from "../services/api";
import ReceiptScanner from "../components/ReceiptScanner";

const AddTransaction = () => {
  const [categories, setCategories] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerKey, setScannerKey] = useState(0); // reset scanner after use
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    category: "",
    title: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    recurringInterval: "",
    recurringEndDate: "" // new field for optional end date
  });

  // Fetch categories (default + user-created)
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // Called when ReceiptScanner successfully extracts data
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
    setScannerKey((k) => k + 1); // reset scanner state
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare payload
      const payload = {
        ...form,
        recurringEndDate:
          form.recurringEndDate === "" ? null : form.recurringEndDate
      };

      await addTransaction(payload);
      alert("Transaction added successfully!");

      // Reset form
      setForm((prev) => ({
        ...prev,
        amount: "",
        category: "",
        title: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
        isRecurring: false,
        recurringInterval: "",
        recurringEndDate: ""
      }));
    } catch (err) {
      console.error(err);
      alert("Error adding transaction!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Add Transaction</h2>

      {/* Receipt Scanner toggle */}
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
        {/* Amount */}
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Amount"
          required
          className="w-full p-2 border rounded"
        />

        {/* Type */}
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        {/* Category */}
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Title */}
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Title (optional)"
          className="w-full p-2 border rounded"
        />

        {/* Note */}
        <input
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Note (optional)"
          className="w-full p-2 border rounded"
        />

        {/* Date */}
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
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
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                Leave empty for indefinite recurring (e.g., subscriptions)
              </p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Add Transaction
        </button>
      </form>
    </div>
  );
};

export default AddTransaction;
import { useEffect, useMemo, useState } from "react";
import { getTransactions } from "../services/api";

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString("en-IN");
  } catch {
    return value;
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value || 0);
}

function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = {};
      if (typeFilter !== "all") {
        params.type = typeFilter;
      }

      const res = await getTransactions(params);
      setTransactions(res.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load report data.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    const expense = transactions
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>

        <div className="flex items-center gap-2">
          <label htmlFor="typeFilter" className="text-sm text-slate-700">Type</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">Total Income</p>
          <p className="text-xl font-semibold text-green-700">{formatCurrency(totals.income)}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Total Expense</p>
          <p className="text-xl font-semibold text-red-700">{formatCurrency(totals.expense)}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">Net Balance</p>
          <p className="text-xl font-semibold text-blue-700">{formatCurrency(totals.balance)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>Loading report data...</td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td className="px-4 py-6 text-red-600" colSpan={5}>{error}</td>
              </tr>
            )}

            {!isLoading && !error && transactions.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={5}>No transactions found for this filter.</td>
              </tr>
            )}

            {!isLoading && !error && transactions.map((item) => (
              <tr key={item._id} className="border-t border-slate-100">
                <td className="px-4 py-3">{formatDate(item.date)}</td>
                <td className="px-4 py-3">{item.title || "Untitled"}</td>
                <td className="px-4 py-3">{item.category?.name || "Uncategorized"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.type === "income"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reports;
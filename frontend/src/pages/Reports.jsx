import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router"; // Added for navigation support
import { getTransactions, updateTransaction, deleteTransaction, getCategories } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN");
  } catch { return value; }
}

function Reports() {
  const location = useLocation();
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const queryParams = new URLSearchParams(location.search);

  // --- Initial URL State ---
  // We check if values exist in the URL (from Dashboard clicks), otherwise use defaults
  const initialType = queryParams.get("type") || "all";
  const initialCat = queryParams.get("category") || "all";
  const initialMonth = queryParams.get("month") || "";
  const initialYear = Number(queryParams.get("year")) || new Date().getFullYear();

  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // --- Filters ---
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [catFilter, setCatFilter] = useState(initialCat);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // --- Edit Mode ---
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ 
    title: "", amount: "", type: "", date: "", category: "", note: "", isRecurring: false, recurringInterval: "", recurringEndDate: ""
  });
  const [statusMessage, setStatusMessage] = useState("");

  const currencyRegion = user?.region || "en-IN";
  const currencyCode = user?.currencyCode || "INR";

  useEffect(() => {
    // Load categories first so we can map Names to IDs if needed
    loadCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, catFilter, sortOrder, selectedMonth, selectedYear, categories]);

  useEffect(() => {
    if (typeFilter === "all" || catFilter === "all") return;
    const selectedCategory = categories.find((category) => category._id === catFilter);
    if (selectedCategory && selectedCategory.type !== typeFilter) {
      setCatFilter("all");
    }
  }, [typeFilter, catFilter, categories]);

  const loadCategories = async () => {
    try {
      const res = await getCategories();
      const data = res.data?.categories || [];
      setCategories(data);
    } catch (err) { console.error("Dropdown Error", err); }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Logic to handle Dashboard click: 
      // If catFilter is a Name (e.g. "Food"), find its ID. If it's already "all" or an ID, use it.
      let categoryId = catFilter;
      if (catFilter !== "all" && categories.length > 0) {
        const found = categories.find(c => c.name === catFilter || c._id === catFilter);
        if (found) categoryId = found._id;
      }

      const params = {
        sort: sortOrder === "desc" ? "-date" : "date",
        year: selectedYear,
      };

      if (typeFilter !== "all") params.type = typeFilter;
      if (categoryId !== "all") params.category = categoryId;
      if (selectedMonth) params.month = selectedMonth;

      const res = await getTransactions(params);
      setTransactions(res.data?.data || []);
    } catch (err) {
      setError("Failed to load transactions.");
    } finally { setIsLoading(false); }
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setEditForm({
      title: item.title,
      amount: item.amount,
      type: item.type,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : "",
      category: item.category?._id || item.category || "",
      note: item.note || "",
      isRecurring: Boolean(item.isRecurring || item.recurringGroupId),
      recurringInterval: item.recurringInterval || "",
      recurringEndDate: item.recurringEndDate ? new Date(item.recurringEndDate).toISOString().split('T')[0] : "",
    });
  };

  const handleUpdate = async (id) => {
    if (editForm.date > today) {
      alert("Transaction date cannot be in the future.");
      return;
    }

    if (editForm.recurringEndDate && editForm.recurringEndDate > today) {
      alert("Recurring end date cannot be in the future.");
      return;
    }

    try {
      const payload = {
        ...editForm,
        amount: Number(editForm.amount),
      };

      if (!payload.isRecurring) {
        payload.recurringInterval = "";
        payload.recurringEndDate = null;
      } else {
        payload.recurringEndDate = payload.recurringEndDate || null;
      }

      await updateTransaction(id, payload);
      setEditingId(null);
      showStatus("Transaction Updated!");
      fetchTransactions();
    } catch (err) { alert("Update failed."); }
  };

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, i) => s + (i.amount || 0), 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, i) => s + (i.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const categoryFilterOptions =
    typeFilter === "all" ? categories : categories.filter((category) => category.type === typeFilter);

  return (
    <div className="space-y-6 pb-10 px-2">
      {statusMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-2 rounded-full shadow-2xl z-50 text-sm font-medium">
          {statusMessage}
        </div>
      )}

      {/* --- Filter Bar --- */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Type</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Category</label>
          <select 
            value={categories.some(c => c.name === catFilter) ? categories.find(c => c.name === catFilter)?._id : catFilter} 
            onChange={(e) => setCatFilter(e.target.value)} 
            className="border rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categoryFilterOptions.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Full Year</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Year</label>
          <input type="number" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border rounded-lg p-2 text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Sort By</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border rounded-lg p-2 text-sm font-semibold text-blue-600 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="desc">Latest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-xs text-green-600 font-bold uppercase">Income</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.income, currencyRegion, currencyCode)}</p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600 font-bold uppercase">Expense</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.expense, currencyRegion, currencyCode)}</p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-600 font-bold uppercase">Balance</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.balance, currencyRegion, currencyCode)}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-widest text-left">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td className="px-6 py-10 text-center text-slate-400" colSpan={7}>Fetching reports...</td></tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {editingId === item._id ? (
                        <input type="date" max={today} className="border rounded p-1 text-xs" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} />
                      ) : formatDate(item.date)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {editingId === item._id ? (
                        <input className="border rounded px-2 py-1 w-full text-sm" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
                      ) : (item.title || "Untitled")}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {editingId === item._id ? (
                        <select className="border rounded p-1 w-full bg-white" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})}>
                          {categories
                            .filter((c) => c.type === editForm.type)
                            .map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      ) : (item.category?.name || "General")}
                    </td>
                    <td className="px-6 py-4 text-slate-400 italic">
                      {editingId === item._id ? (
                        <div className="space-y-2">
                          <input className="border rounded px-2 py-1 w-full" value={editForm.note} onChange={(e) => setEditForm({...editForm, note: e.target.value})} />

                          <label className="flex items-center gap-2 text-xs text-slate-600 not-italic">
                            <input
                              type="checkbox"
                              checked={editForm.isRecurring}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                isRecurring: e.target.checked,
                                recurringInterval: e.target.checked ? (editForm.recurringInterval || "monthly") : "",
                                recurringEndDate: e.target.checked ? editForm.recurringEndDate : "",
                              })}
                            />
                            Recurring
                          </label>

                          {editForm.isRecurring && (
                            <div className="space-y-2 not-italic">
                              <select
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={editForm.recurringInterval}
                                onChange={(e) => setEditForm({ ...editForm, recurringInterval: e.target.value })}
                              >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                              </select>
                              <input
                                type="date"
                                max={today}
                                className="border rounded px-2 py-1 w-full text-xs"
                                value={editForm.recurringEndDate || ""}
                                onChange={(e) => setEditForm({ ...editForm, recurringEndDate: e.target.value })}
                              />
                              <p className="text-[10px] text-slate-500">Set an end date to auto-schedule the series.</p>
                            </div>
                          )}
                        </div>
                      ) : (item.note || "—")}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item._id ? (
                        <select className="border rounded p-1 bg-white" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})}>
                          <option value="income">income</option>
                          <option value="expense">expense</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.type}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {editingId === item._id ? (
                        <input type="number" className="border rounded px-2 py-1 w-24 text-right font-bold" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} />
                      ) : formatCurrency(item.amount, currencyRegion, currencyCode)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        {editingId === item._id ? (
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleUpdate(item._id)} className="text-green-600 font-bold hover:underline">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 text-xs hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-4">
                            <button onClick={() => handleEditClick(item)} className="text-blue-500 font-medium hover:text-blue-700">Edit</button>
                            <button onClick={() => deleteTransaction(item._id).then(fetchTransactions)} className="text-red-400 font-medium hover:text-red-600">Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
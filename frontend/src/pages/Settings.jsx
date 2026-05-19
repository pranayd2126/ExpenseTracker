import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  exportBackup,
  getCategories,
  addCategory,
  deleteCategory,
  importTransactions,
} from "../services/api";
import { FaFilePdf, FaFileCsv, FaFileExcel, FaFileCode, FaUpload } from "react-icons/fa";

const REGION_OPTIONS = [
  { value: "en-IN", label: "India (en-IN)" },
  { value: "en-US", label: "United States (en-US)" },
  { value: "en-GB", label: "United Kingdom (en-GB)" },
  { value: "en-AU", label: "Australia (en-AU)" },
  { value: "en-CA", label: "Canada (en-CA)" },
];

const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
];

function Settings() {
  const { user, refreshUser, theme, setTheme } = useAuth();
  const [profileForm, setProfileForm] = useState({
    region: "en-IN",
    currencyCode: "INR",
    theme: "light",
  });
  
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense" });
  const [categories, setCategories] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const customCategories = useMemo(
    () => categories.filter((category) => !category.isDefault),
    [categories],
  );

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      region: user.region || "en-IN",
      currencyCode: user.currencyCode || "INR",
      theme: user.theme || theme || "light",
    });
  }, [user, theme]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data?.categories || []);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      await updateProfile(profileForm);
      setTheme(profileForm.theme);
      await refreshUser();
      toast.success("App preferences updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update preferences");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const downloadBackup = async (format) => {
    setIsExportingBackup(true);
    try {
      const response = await exportBackup(format);
      
      let mimeType = "application/json";
      if (format === "pdf") mimeType = "application/pdf";
      if (format === "csv") mimeType = "text/csv";
      if (format === "excel") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      const extension = format === "excel" ? "xlsx" : format;
      const fileName =
        response.headers["content-disposition"]
          ?.split("filename=")[1]
          ?.replace(/\"/g, "") || `expense-tracker-export-${new Date().toISOString().slice(0, 10)}.${extension}`;

      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast.error("Please select a valid CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const response = await importTransactions(formData);
      toast.success(response.data.message || "CSV Imported successfully");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to import CSV");
    } finally {
      setIsImporting(false);
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();

    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsAddingCategory(true);
    try {
      await addCategory({ name: categoryForm.name.trim(), type: categoryForm.type });
      setCategoryForm({ name: "", type: "expense" });
      toast.success("Custom category added");
      await loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to add category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const removeCategory = async (categoryId) => {
    try {
      await deleteCategory(categoryId);
      toast.success("Category removed");
      await loadCategories();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove category");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">Manage app preferences, categories, data import and export.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">App Preferences</h2>
        <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Region</label>
            <select name="region" value={profileForm.region} onChange={onProfileChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              {REGION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Currency Code</label>
            <select name="currencyCode" value={profileForm.currencyCode} onChange={onProfileChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Theme</label>
            <select name="theme" value={profileForm.theme} onChange={onProfileChange} className="w-full rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="light">Light Theme</option>
              <option value="dark">Dark Theme</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
              {isSavingProfile ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Data Management</h2>
        
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Export Section */}
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Export Transactions</h3>
            <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">Download your data in various formats.</p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => downloadBackup('pdf')}
                disabled={isExportingBackup}
                className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                <FaFilePdf /> PDF
              </button>
              <button
                type="button"
                onClick={() => downloadBackup('excel')}
                disabled={isExportingBackup}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                <FaFileExcel /> Excel
              </button>
              <button
                type="button"
                onClick={() => downloadBackup('csv')}
                disabled={isExportingBackup}
                className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                <FaFileCsv /> CSV
              </button>
              <button
                type="button"
                onClick={() => downloadBackup('json')}
                disabled={isExportingBackup}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <FaFileCode /> JSON
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Import Transactions</h3>
            <p className="mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">Upload a CSV file. Our AI will automatically categorize your imports.</p>
            
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors ${isImporting ? 'pointer-events-none opacity-50' : ''}`}
              >
                <FaUpload className="text-lg" />
                {isImporting ? "Importing Data..." : "Click to select a CSV file"}
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Custom Categories</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Create up to 10 private categories. General categories are shared for all users.</p>

        <form onSubmit={createCategory} className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            name="name"
            value={categoryForm.name}
            onChange={onCategoryChange}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            name="type"
            value={categoryForm.type}
            onChange={onCategoryChange}
            className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <button
            type="submit"
            disabled={isAddingCategory}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAddingCategory ? "Adding..." : "Add Category"}
          </button>
        </form>

        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your custom categories ({customCategories.length}/10)</p>
          <ul className="mt-2 space-y-2">
            {customCategories.map((category) => (
              <li key={category._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700 dark:text-slate-100">
                <span>{category.name} <span className="text-xs text-slate-400">({category.type})</span></span>
                <button
                  type="button"
                  onClick={() => removeCategory(category._id)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Delete
                </button>
              </li>
            ))}
            {customCategories.length === 0 && (
              <li className="text-sm text-slate-500 dark:text-slate-300">No custom categories yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default Settings;

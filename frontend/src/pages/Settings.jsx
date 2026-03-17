import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  changePassword,
  exportBackup,
  getCategories,
  addCategory,
  deleteCategory,
} from "../services/api";

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
    firstName: "",
    lastName: "",
    email: "",
    country: "",
    region: "en-IN",
    currencyCode: "INR",
    theme: "light",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense" });
  const [categories, setCategories] = useState([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const customCategories = useMemo(
    () => categories.filter((category) => !category.isDefault),
    [categories],
  );

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      country: user.country || "India",
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

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
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
      toast.success("Profile and preferences updated");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password must match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed. Please login again.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const downloadBackup = async () => {
    setIsExportingBackup(true);
    try {
      const response = await exportBackup();
      const blob = new Blob([response.data], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      const fileName =
        response.headers["content-disposition"]
          ?.split("filename=")[1]
          ?.replace(/\"/g, "") || `expense-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success("Backup exported successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to export backup");
    } finally {
      setIsExportingBackup(false);
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
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Profile & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">Manage preferences, security, backups, and private categories.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Personal Info & Preferences</h2>
        <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input name="firstName" value={profileForm.firstName} onChange={onProfileChange} placeholder="First name" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <input name="lastName" value={profileForm.lastName} onChange={onProfileChange} placeholder="Last name" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <input name="email" type="email" value={profileForm.email} onChange={onProfileChange} placeholder="Email" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <input name="country" value={profileForm.country} onChange={onProfileChange} placeholder="Country" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />

          <select name="region" value={profileForm.region} onChange={onProfileChange} className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            {REGION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select name="currencyCode" value={profileForm.currencyCode} onChange={onProfileChange} className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select name="theme" value={profileForm.theme} onChange={onProfileChange} className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
          </select>

          <div className="md:col-span-2">
            <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Security</h2>
        <form onSubmit={updatePassword} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={onPasswordChange} placeholder="Current password" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={onPasswordChange} placeholder="New password" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={onPasswordChange} placeholder="Confirm password" className="rounded-lg border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
          <div className="md:col-span-3">
            <button type="submit" disabled={isUpdatingPassword} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300">
              {isUpdatingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Backup</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Export your profile, categories, and transactions as a JSON backup.</p>
        <button
          type="button"
          onClick={downloadBackup}
          disabled={isExportingBackup}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
        >
          {isExportingBackup ? "Exporting..." : "Export Backup"}
        </button>
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

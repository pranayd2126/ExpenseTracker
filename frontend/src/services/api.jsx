// src/services/api.jsx
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send JWT cookie automatically
  headers: { "Content-Type": "application/json" },
});

// ─── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (params) => axiosInstance.get("/expenses", { params });
export const addTransaction  = (data) =>   axiosInstance.post("/expenses", data);
export const updateTransaction = (id, data) => axiosInstance.put(`/expenses/${id}`, data);
export const deleteTransaction = (id) =>      axiosInstance.delete(`/expenses/${id}`);

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalytics = (params) => axiosInstance.get("/expenses/analytics", { params });

// ─── Categories ──────────────────────────────────────────────────────────────
export const getCategories  = ()     => axiosInstance.get("/categories");
export const addCategory    = (data) => axiosInstance.post("/categories", data);
export const deleteCategory = (id)   => axiosInstance.delete(`/categories/${id}`);

// ─── AI ───────────────────────────────────────────────────────────────────────
// Receipt scanning — sends multipart/form-data (FormData object)
export const scanReceipt = (formData) =>
  axiosInstance.post("/ai/scan-receipt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Suggestions + prediction in one call
export const getInsights = () => axiosInstance.get("/ai/suggestions");

// Prediction only
export const predictExpenses = () => axiosInstance.get("/ai/predict");

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const register = (data) => axiosInstance.post("/users/register", data);
export const login    = (data) => axiosInstance.post("/users/login", data);
export const logout   = ()     => axiosInstance.post("/users/logout");
export const getProfile  = ()     => axiosInstance.get("/users/profile");
export const updateProfile = (data) => axiosInstance.put("/users/profile", data);
export const changePassword = (data) => axiosInstance.post("/users/changePassword", data);
export const exportBackup = () => axiosInstance.get("/users/backup", { responseType: "blob" });

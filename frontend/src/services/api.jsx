// src/services/api.jsx
import axios from "axios";

const API_URL = "http://localhost:5000/api"; // change to your backend URL

const token = localStorage.getItem("token"); // assume login stores JWT here

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }
});

// Transactions
export const getTransactions = (params) => axiosInstance.get("/expenses", { params });
export const addTransaction = (data) => axiosInstance.post("/expenses", data);
export const updateTransaction = (id, data) => axiosInstance.patch(`/expenses/${id}`, data);
export const deleteTransaction = (id) => axiosInstance.delete(`/expenses/${id}`);

// Categories
export const getCategories = () => axiosInstance.get("/categories");
export const addCategory = (data) => axiosInstance.post("/categories", data);

// Analytics
export const getAnalytics = (params) => axiosInstance.get("/analytics", { params });

// AI Insights
export const getInsights = () => axiosInstance.get("/ai/insights");
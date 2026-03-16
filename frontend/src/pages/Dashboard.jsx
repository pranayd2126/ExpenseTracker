// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SummaryCards from "../components/SummaryCards";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import BudgetProgress from "../components/BudgetProgress";
import Insights from "../components/Insights";
import { getAnalytics, getInsights } from "../services/api";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [analyticsRes, insightsRes] = await Promise.allSettled([
        getAnalytics(),
        getInsights(),
      ]);

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value?.data?.data || null);
      } else {
        setError(analyticsRes.reason?.response?.data?.message || "Failed to load analytics");
      }

      if (insightsRes.status === "fulfilled") {
        setAiInsights(insightsRes.value?.data?.data || null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred while loading dashboard");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 font-medium">Unable to load dashboard</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-600">No data available.</div>
      </div>
    );
  }

  const hasTransactions = (analytics.categoryTotals?.length || 0) > 0 || (analytics.monthlyTotals?.length || 0) > 0;

  return (
    <div className="p-4 space-y-6">
      <SummaryCards
        income={analytics.income || 0}
        expense={analytics.expense || 0}
        balance={analytics.balance || 0}
      />

      {!hasTransactions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800 font-medium mb-3">Get started with your first transaction</p>
          <Link
            to="/add"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Transaction
          </Link>
        </div>
      )}

      {hasTransactions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Category Distribution</h3>
            <PieChart data={analytics.categoryTotals} />
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Monthly Trend</h3>
            <BarChart data={analytics.monthlyTotals} />
          </section>
        </div>
      )}

      {hasTransactions && <BudgetProgress analytics={analytics} />}
      {aiInsights && <Insights data={aiInsights} />}
    </div>
  );
};

export default Dashboard;
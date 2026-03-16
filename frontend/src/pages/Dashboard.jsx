// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import SummaryCards from "../components/SummaryCards";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import BudgetProgress from "../components/BudgetProgress";
import Insights from "../components/Insights";
import { getAnalytics, getInsights } from "../services/api";

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    fetchInsights();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data } = await getInsights();
      setAiInsights(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <SummaryCards
        income={analytics.income}
        expense={analytics.expense}
        balance={analytics.balance}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PieChart data={analytics.categoryTotals} />
        <BarChart data={analytics.monthlyTotals} />
      </div>
      <BudgetProgress analytics={analytics} />
      {aiInsights && <Insights data={aiInsights} />}
    </div>
  );
};

export default Dashboard;
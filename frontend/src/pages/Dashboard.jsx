import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import SummaryCards from "../components/SummaryCards";
import PieChart from "../components/PieChart";
import BarChart from "../components/BarChart";
import BudgetProgress from "../components/BudgetProgress";
import Insights from "../components/Insights";
import { getAnalytics, getInsights } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [timeframe, setTimeframe] = useState("month");
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear() - 1);
  const [historyMonth, setHistoryMonth] = useState("");

  useEffect(() => {
    fetchData();
  }, [timeframe, historyYear, historyMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { timeframe };
      if (timeframe === "history") {
        params.year = historyYear;
        if (historyMonth) params.month = historyMonth;
      }
      
      const [analyticsRes, insightsRes] = await Promise.allSettled([
        getAnalytics(params),
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
      setError("An error occurred while loading dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/reports?category=${categoryName}`);
  };

  // --- NEW: Handle Bar Chart Clicks ---
  const handleTrendClick = (label) => {
    // label usually comes as "M/YYYY" from our BarChart setup
    const [month, year] = label.split('/');
    if (month && year) {
      navigate(`/reports?month=${month}&year=${year}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mr-3"></div>
        Loading dashboard...
      </div>
    );
  }

  const hasTransactions = analytics && ((analytics.categoryTotals?.length || 0) > 0 || (analytics.monthlyTotals?.length || 0) > 0);
  const now = new Date();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const yearOptions = Array.from({ length: 10 }, (_, index) => now.getFullYear() - index - 1);
  const historyLabel = historyMonth
    ? `${monthNames[Number(historyMonth) - 1]} ${historyYear}`
    : `Year ${historyYear}`;

  const viewingLabel = {
    day: "Today",
    week: "Current Week",
    month: now.toLocaleString("en", { month: "long", year: "numeric" }),
    year: `Current Year (${now.getFullYear()})`,
    history: `Past: ${historyLabel}`,
  };

  const timeframeOptions = [
    { value: "day", label: "DAY" },
    { value: "week", label: "WEEK" },
    { value: "month", label: "MONTH" },
    { value: "year", label: "YEAR" },
    { value: "history", label: "PAST YEARS" },
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Viewing: {viewingLabel[timeframe]}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {timeframe === "history" && (
            <>
              <select
                value={historyYear}
                onChange={(e) => setHistoryYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white text-slate-700 outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                value={historyMonth}
                onChange={(e) => setHistoryMonth(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white text-slate-700 outline-none"
              >
                <option value="">ALL MONTHS</option>
                {monthNames.map((m, index) => (
                  <option key={m} value={index + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeframe(option.value)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  timeframe === option.value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {analytics && (
        <SummaryCards
          income={analytics.income || 0}
          expense={analytics.expense || 0}
          balance={analytics.balance || 0}
          selectedFilter={timeframe}
        />
      )}

      {hasTransactions ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[300px]">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wider">Category Distribution</h3>
              <PieChart 
                data={analytics?.categoryTotals} 
                onSliceClick={handleCategoryClick} 
              />
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[300px]">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 uppercase tracking-wider">Spending Trend</h3>
              {/* Added onBarClick prop */}
              <BarChart 
                data={analytics?.monthlyTotals} 
                onBarClick={handleTrendClick} 
              />
            </section>
          </div>
          <BudgetProgress analytics={analytics} />
        </>
      ) : (
        <div className="p-10 text-center border-2 border-dashed rounded-xl text-slate-400">
           No data available for this selection. <Link to="/add" className="text-blue-600 hover:underline">Add a transaction</Link>
        </div>
      )}

      {aiInsights && <Insights data={aiInsights} />}
    </div>
  );
};

export default Dashboard;
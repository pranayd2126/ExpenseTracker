import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchData();
  }, [timeframe, selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { timeframe, month: selectedMonth, year: selectedYear };
      
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
    navigate(`/reports?category=${categoryName}&month=${selectedMonth}&year=${selectedYear}`);
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Viewing: {timeframe === 'month' ? `${new Date(0, selectedMonth - 1).toLocaleString('en', {month: 'long'})} ${selectedYear}` : selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
             {timeframe === 'month' && (
               <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none"
               >
                 {Array.from({length: 12}, (_, i) => (
                   <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', {month: 'short'})}</option>
                 ))}
               </select>
             )}
             <input 
              type="number" 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-20 text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none"
             />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['day', 'week', 'month', 'year'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  timeframe === t ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {t.toUpperCase()}
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
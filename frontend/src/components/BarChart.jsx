import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/currency";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ data, onBarClick }) => {
  const { user } = useAuth();
  const region = user?.region || "en-IN";
  const currencyCode = user?.currencyCode || "INR";

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500 text-sm">No monthly data yet. Add a transaction to see trends.</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Add onClick handler for Chart.js
    onClick: (event, elements) => {
      if (elements.length > 0 && onBarClick) {
        const elementIndex = elements[0].index;
        const label = chartData.labels[elementIndex];
        onBarClick(label); // Sends "3/2026" back to Dashboard
      }
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return ` ${label}: ${formatCurrency(value, region, currencyCode)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true, font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 } }
      },
    },
    layout: {
      padding: 8,
    },
  };

  const chartData = {
    // Backend returns month (1-12) and year
    labels: data.map(d => `${d._id.month}/${d._id.year}`), 
    datasets: [
      {
        label: "Income",
        data: data.map(d => d.income || 0),
        backgroundColor: "#34d399",
        borderRadius: 4,
      },
      {
        label: "Expense",
        data: data.map(d => d.expense || 0),
        backgroundColor: "#f87171",
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="h-70 w-full sm:h-80 cursor-pointer">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default BarChart;
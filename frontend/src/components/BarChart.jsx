// src/components/BarChart.jsx
import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">No monthly data yet. Add a transaction to see trends.</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        ticks: { maxRotation: 0, autoSkip: true },
      },
      y: {
        beginAtZero: true,
      },
    },
    layout: {
      padding: 8,
    },
  };

  const chartData = {
    labels: data.map(d => `${d._id.month}/${d._id.year}`), // assuming backend returns month/year
    datasets: [
      {
        label: "Income",
        data: data.map(d => d.income || 0),
        backgroundColor: "#34d399"
      },
      {
        label: "Expense",
        data: data.map(d => d.expense || 0),
        backgroundColor: "#f87171"
      }
    ]
  };

  return (
    <div className="h-70 w-full sm:h-80">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default BarChart;
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data, onSliceClick }) => { // Added onSliceClick prop
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500 text-sm px-4 text-center">No expense data yet. Add a transaction to see the breakdown.</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Add onClick handler for Chart.js
    onClick: (event, elements) => {
      if (elements.length > 0 && onSliceClick) {
        const elementIndex = elements[0].index;
        const categoryName = chartData.labels[elementIndex];
        onSliceClick(categoryName);
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
            const label = context.label || '';
            const value = context.parsed || 0;
            return ` ${label}: ₹${value.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    layout: {
      padding: 8,
    },
  };

  const chartData = {
    labels: data.map(d => d.categoryName),
    datasets: [
      {
        label: "Expense by Category",
        data: data.map(d => d.totalAmount),
        backgroundColor: [
          "#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="h-70 w-full sm:h-80 cursor-pointer">
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
};

export default PieChart;
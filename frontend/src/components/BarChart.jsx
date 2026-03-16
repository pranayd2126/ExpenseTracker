// src/components/BarChart.jsx
import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const BarChart = ({ data }) => {
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

  return <Bar data={chartData} />;
};

export default BarChart;
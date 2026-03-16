// src/components/PieChart.jsx
import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.categoryName),
    datasets: [
      {
        label: "Expense by Category",
        data: data.map(d => d.totalAmount),
        backgroundColor: [
          "#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"
        ]
      }
    ]
  };

  return <Pie data={chartData} />;
};

export default PieChart;
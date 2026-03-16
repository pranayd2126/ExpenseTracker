// src/components/Insights.jsx
import React from "react";

const Insights = ({ data }) => {
  return (
    <div className="p-4 bg-yellow-100 rounded shadow mt-6">
      <h2 className="text-gray-700 mb-2">AI Insights</h2>
      <p>{data.suggestion}</p>
      <p>Total Income: ₹{data.totalIncome}</p>
      <p>Total Expense: ₹{data.totalExpense}</p>
    </div>
  );
};

export default Insights;
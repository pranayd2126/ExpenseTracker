// src/components/BudgetProgress.jsx
import React from "react";

const BudgetProgress = ({ analytics }) => {
  const { income, expense } = analytics;
  const percentage = income ? Math.min((expense / income) * 100, 100) : 0;

  return (
    <div className="p-4 bg-gray-100 rounded shadow">
      <h2 className="text-gray-700 mb-2">Budget Usage</h2>
      <div className="w-full bg-gray-300 h-4 rounded">
        <div
          className="bg-blue-500 h-4 rounded"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-gray-600 mt-1">{percentage.toFixed(1)}% of income spent</p>
    </div>
  );
};

export default BudgetProgress;
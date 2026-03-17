// src/components/SummaryCards.jsx
import React from "react";

const SummaryCards = ({ income, expense, balance, selectedFilter }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Capitalize first letter for display
  const filterLabel = selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-green-100 rounded shadow border-l-4 border-green-500">
        <h2 className="text-gray-600 text-sm font-medium">Income ({filterLabel})</h2>
        <p className="text-2xl font-bold text-green-700">{formatCurrency(income)}</p>
      </div>
      <div className="p-4 bg-red-100 rounded shadow border-l-4 border-red-500">
        <h2 className="text-gray-600 text-sm font-medium">Expense ({filterLabel})</h2>
        <p className="text-2xl font-bold text-red-700">{formatCurrency(expense)}</p>
      </div>
      <div className="p-4 bg-blue-100 rounded shadow border-l-4 border-blue-500">
        <h2 className="text-gray-600 text-sm font-medium">Balance</h2>
        <p className="text-2xl font-bold text-blue-700">{formatCurrency(balance)}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
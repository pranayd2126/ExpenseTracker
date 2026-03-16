// src/components/SummaryCards.jsx
import React from "react";

const SummaryCards = ({ income, expense, balance }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-green-100 rounded shadow">
        <h2 className="text-gray-600">Income</h2>
        <p className="text-2xl font-bold text-green-700">{formatCurrency(income)}</p>
      </div>
      <div className="p-4 bg-red-100 rounded shadow">
        <h2 className="text-gray-600">Expense</h2>
        <p className="text-2xl font-bold text-red-700">{formatCurrency(expense)}</p>
      </div>
      <div className="p-4 bg-blue-100 rounded shadow">
        <h2 className="text-gray-600">Balance</h2>
        <p className="text-2xl font-bold text-blue-700">{formatCurrency(balance)}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
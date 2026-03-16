// src/components/SummaryCards.jsx
import React from "react";

const SummaryCards = ({ income, expense, balance }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 bg-green-100 rounded shadow">
        <h2 className="text-gray-600">Income</h2>
        <p className="text-2xl font-bold text-green-700">₹{income}</p>
      </div>
      <div className="p-4 bg-red-100 rounded shadow">
        <h2 className="text-gray-600">Expense</h2>
        <p className="text-2xl font-bold text-red-700">₹{expense}</p>
      </div>
      <div className="p-4 bg-blue-100 rounded shadow">
        <h2 className="text-gray-600">Balance</h2>
        <p className="text-2xl font-bold text-blue-700">₹{balance}</p>
      </div>
    </div>
  );
};

export default SummaryCards;
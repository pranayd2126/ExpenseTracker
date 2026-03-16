// src/components/Insights.jsx
import React from "react";
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const trendIcon = {
  increasing: <FiTrendingUp className="text-red-500" size={18} />,
  decreasing: <FiTrendingDown className="text-green-500" size={18} />,
  stable: <FiMinus className="text-blue-500" size={18} />,
};

const Insights = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-4">

      {/* Key insight */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
        <h2 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
          <FiAlertCircle size={16} /> AI Insights
        </h2>
        <p className="text-gray-700 text-sm">{data.suggestion}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <span className="text-green-700 font-medium">Income: ₹{data.totalIncome?.toLocaleString()}</span>
          <span className="text-red-700 font-medium">Expense: ₹{data.totalExpense?.toLocaleString()}</span>
        </div>
        {data.savingsGoal && (
          <p className="text-xs text-blue-600 mt-2">💡 Suggested savings goal: <strong>{data.savingsGoal}</strong></p>
        )}
        {data.highestSpendCategory && (
          <p className="text-xs text-gray-500 mt-1">Highest spend: <strong>{data.highestSpendCategory}</strong></p>
        )}
      </div>

      {/* Money-saving tips */}
      {data.tips && data.tips.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <FiCheckCircle size={16} /> Money-saving Tips
          </h3>
          <ul className="space-y-2">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next-month prediction */}
      {data.prediction != null && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
          <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
            {trendIcon[data.trend] ?? <FiTrendingUp size={18} />}
            Next Month Prediction
          </h3>
          <p className="text-3xl font-bold text-purple-700">
            ₹{Number(data.prediction).toLocaleString()}
          </p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            {data.trend && <span className="capitalize">Trend: {data.trend}</span>}
            {data.confidence && <span className="capitalize">Confidence: {data.confidence}</span>}
          </div>
          {data.message && (
            <p className="text-sm text-gray-600 mt-2">{data.message}</p>
          )}
        </div>
      )}

    </div>
  );
};

export default Insights;
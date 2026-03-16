import PieChart from "./PieChart";
import BarChart from "./BarChart";

function Charts() {
  return (
    <div className="grid grid-cols-2 gap-6">

      <div className="bg-white p-5 rounded shadow">
        <h2 className="mb-4 font-semibold">Category Spending</h2>
        <PieChart />
      </div>

      <div className="bg-white p-5 rounded shadow">
        <h2 className="mb-4 font-semibold">Monthly Expenses</h2>
        <BarChart />
      </div>

    </div>
  );
}

export default Charts;
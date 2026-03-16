import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center">

      <h1 className="text-xl font-bold">ExpenseTracker</h1>

      <nav className="flex gap-6">

        <Link
          to="/"
          className="hover:text-blue-400"
        >
          Dashboard
        </Link>

        <Link
          to="/add"
          className="hover:text-blue-400"
        >
          Add Transaction
        </Link>

        <Link
          to="/reports"
          className="hover:text-blue-400"
        >
          Reports
        </Link>

      </nav>

    </header>
  );
}

export default Header;
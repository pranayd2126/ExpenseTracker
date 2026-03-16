import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

function Header() {
  const navigate = useNavigate();
  const { logoutUser, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logout successful");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to logout right now.");
    }
  };

  return (
    <header className="flex flex-col gap-4 bg-slate-900 px-8 py-4 text-white md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-bold">ExpenseTracker</h1>
        <p className="text-sm text-slate-300">Welcome back, {user?.firstName || "User"}</p>
      </div>

      <nav className="flex flex-wrap items-center gap-6">
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
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

export default Header;
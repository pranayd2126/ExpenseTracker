import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { FaChartPie, FaPlusCircle, FaFileAlt, FaBars, FaTimes, FaCog, FaMoon, FaSun } from "react-icons/fa";

function Header() {
  const navigate = useNavigate();
  const { logoutUser, user, theme, setTheme } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logout successful");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Unable to logout right now."
      );
    }
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 ${
      isActive
        ? "text-blue-400 font-semibold border-b-2 border-blue-400 pb-1"
        : "text-slate-200 hover:text-blue-400 transition"
    }`;

  return (
    <header className="bg-slate-900 text-white px-6 py-4 shadow-md">
      
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div>
          <h1 className="text-xl font-bold">ExpenseTracker</h1>
          <p className="text-xs text-slate-400">
            Welcome, {user?.firstName || "User"}
          </p>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={linkClass} end>
            <FaChartPie /> Dashboard
          </NavLink>

          <NavLink to="/add" className={linkClass}>
            <FaPlusCircle /> Add
          </NavLink>

          <NavLink to="/reports" className={linkClass}>
            <FaFileAlt /> Reports
          </NavLink>

          <NavLink to="/settings" className={linkClass}>
            <FaCog /> Settings
          </NavLink>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800"
            title="Toggle theme"
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}
          </button>

          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-600 px-4 py-1 text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="mt-4 flex flex-col gap-4 md:hidden">
          <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
            <FaChartPie /> Dashboard
          </NavLink>

          <NavLink to="/add" className={linkClass} onClick={() => setMenuOpen(false)}>
            <FaPlusCircle /> Add Transaction
          </NavLink>

          <NavLink to="/reports" className={linkClass} onClick={() => setMenuOpen(false)}>
            <FaFileAlt /> Reports
          </NavLink>

          <NavLink to="/settings" className={linkClass} onClick={() => setMenuOpen(false)}>
            <FaCog /> Settings
          </NavLink>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-left border border-slate-600 px-4 py-2 rounded hover:bg-slate-800"
          >
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </button>

          <button
            onClick={handleLogout}
            className="text-left border border-slate-600 px-4 py-2 rounded hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
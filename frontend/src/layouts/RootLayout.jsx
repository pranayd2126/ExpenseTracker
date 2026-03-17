import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

function RootLayout() {
  const { theme } = useAuth();

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-slate-950" : "bg-slate-100"}`}>
      <Header />
      <main className={`flex-1 p-6 ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;
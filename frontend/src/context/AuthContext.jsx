import { createContext, useContext, useEffect, useState } from "react";
import {
  getProfile,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("appTheme") || "light");

  const applyTheme = (nextTheme) => {
    const resolved = nextTheme === "dark" ? "dark" : "light";
    setTheme(resolved);
    localStorage.setItem("appTheme", resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  };

  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      setUser(data.data);
      if (data.data?.theme) {
        applyTheme(data.data.theme);
      }
      return data.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    applyTheme(theme);
    refreshUser();
  }, []);

  const registerUser = async (payload) => {
    const { data } = await registerRequest(payload);
    setUser(data.data);
    return data;
  };

  const loginUser = async (payload) => {
    const { data } = await loginRequest(payload);
    setUser(data.data);
    return data;
  };

  const logoutUser = async () => {
    await logoutRequest();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isAuthLoading,
        loginUser,
        logoutUser,
        refreshUser,
        registerUser,
        theme,
        setTheme: applyTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
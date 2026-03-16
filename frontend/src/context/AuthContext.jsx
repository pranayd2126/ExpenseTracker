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

  const refreshUser = async () => {
    try {
      const { data } = await getProfile();
      setUser(data.data);
      return data.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
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
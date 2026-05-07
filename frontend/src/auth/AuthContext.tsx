import { createContext, useContext, useState } from "react";
import { apiClient } from "../api/client";
import type { AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("retailflow_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email: string, password: string) {
    const response = await apiClient.post<AuthUser>("/api/auth/login", {
      email,
      password,
    });
    localStorage.setItem("retailflow_token", response.data.token);
    localStorage.setItem("retailflow_user", JSON.stringify(response.data));
    setUser(response.data);
  }

  function logout() {
    localStorage.removeItem("retailflow_token");
    localStorage.removeItem("retailflow_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

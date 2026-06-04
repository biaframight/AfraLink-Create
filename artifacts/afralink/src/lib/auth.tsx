import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";

export interface AuthUser {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  role: string;
  fullName?: string | null;
  phone?: string | null;
  state?: string | null;
  city?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, navigate] = useLocation();

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/user");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    const next = encodeURIComponent(location === "/login" ? "/" : location);
    navigate(`/login?next=${next}`);
  }, [navigate, location]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/local-logout", { method: "POST" });
    } catch {}
    setUser(null);
    navigate("/");
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetch: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

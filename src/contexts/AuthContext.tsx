import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SessionResponse {
  user_id: string;
  access_token: string;
  expires_at: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userId: string | null;
  userEmail: string | null;
  login: (token: string, userId: string, email: string) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication on mount - load from SQLite session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await invoke<SessionResponse | null>("get_session");
        if (session) {
          setToken(session.access_token);
          setUserId(session.user_id);
          // Get email from localStorage cache (stored during login)
          const storedEmail = localStorage.getItem("user_email");
          setUserEmail(storedEmail);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (newToken: string, newUserId: string, email: string) => {
    // Session is automatically saved to SQLite by the login use case
    // Just cache email in localStorage for display purposes
    localStorage.setItem("user_email", email);
    setToken(newToken);
    setUserId(newUserId);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await invoke("clear_session");
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
    localStorage.removeItem("user_email");
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      const session = await invoke<SessionResponse | null>("get_session");
      if (session) {
        if (session.access_token !== token) {
          // Token was updated, sync state
          setToken(session.access_token);
          setUserId(session.user_id);
          const storedEmail = localStorage.getItem("user_email");
          setUserEmail(storedEmail);
          setIsAuthenticated(true);
          return true;
        }
        return isAuthenticated;
      } else {
        // No session found
        setToken(null);
        setUserId(null);
        setUserEmail(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Failed to check auth:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        userId,
        userEmail,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
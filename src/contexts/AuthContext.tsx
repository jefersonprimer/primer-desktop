import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SessionResponse {
  user_id: string;
  access_token: string;
  expires_at: number;
  google_access_token?: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  googleAccessToken: string | null;
  login: (token: string, userId: string, email: string, name?: string, picture?: string) => void;
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
  const [userName, setUserName] = useState<string | null>(null);
  const [userPicture, setUserPicture] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Check authentication on mount - load from SQLite session
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await invoke<SessionResponse | null>("get_session");
        if (session) {
          setToken(session.access_token);
          setUserId(session.user_id);
          setGoogleAccessToken(session.google_access_token || null);
          
          // Get user details from localStorage cache (stored during login)
          const storedEmail = localStorage.getItem("user_email");
          const storedName = localStorage.getItem("user_name");
          const storedPicture = localStorage.getItem("user_picture");
          
          setUserEmail(storedEmail);
          setUserName(storedName);
          setUserPicture(storedPicture);
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

  const login = async (newToken: string, newUserId: string, email: string, name?: string, picture?: string) => {
    // Session is automatically saved to SQLite by the login use case
    // Just cache user details in localStorage for display purposes
    localStorage.setItem("user_email", email);
    if (name) localStorage.setItem("user_name", name);
    if (picture) localStorage.setItem("user_picture", picture);
    
    setToken(newToken);
    setUserId(newUserId);
    setUserEmail(email);
    setUserName(name || null);
    setUserPicture(picture || null);
    setIsAuthenticated(true);
    
    // Refresh session to get google token if it exists (e.g. from google login)
    try {
        const session = await invoke<SessionResponse | null>("get_session");
        if (session) {
            setGoogleAccessToken(session.google_access_token || null);
        }
    } catch (e) {
        console.error("Failed to refresh session after login", e);
    }
  };

  const logout = async () => {
    try {
      await invoke("clear_session");
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_picture");
    
    setToken(null);
    setUserId(null);
    setUserEmail(null);
    setUserName(null);
    setUserPicture(null);
    setGoogleAccessToken(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    try {
      const session = await invoke<SessionResponse | null>("get_session");
      if (session) {
        if (session.access_token !== token || session.google_access_token !== googleAccessToken) {
          // Token was updated, sync state
          setToken(session.access_token);
          setUserId(session.user_id);
          setGoogleAccessToken(session.google_access_token || null);
          
          const storedEmail = localStorage.getItem("user_email");
          const storedName = localStorage.getItem("user_name");
          const storedPicture = localStorage.getItem("user_picture");

          setUserEmail(storedEmail);
          setUserName(storedName);
          setUserPicture(storedPicture);
          setIsAuthenticated(true);
          return true;
        }
        return isAuthenticated;
      } else {
        // No session found
        setToken(null);
        setUserId(null);
        setUserEmail(null);
        setUserName(null);
        setUserPicture(null);
        setGoogleAccessToken(null);
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
        userName,
        userPicture,
        googleAccessToken,
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

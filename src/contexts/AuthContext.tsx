import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { Store } from "@tauri-apps/plugin-store";
import { open } from "@tauri-apps/plugin-shell";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface User {
  id: string;
  email: string;
  full_name?: string;
  profile_picture?: string;
  // Calendar connection (separate from login)
  isCalendarConnected?: boolean;
  google_calendar_token?: string | null;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: User;
  // Google Calendar tokens (from backend)
  google_access_token?: string | null;
  google_refresh_token?: string | null;
  google_token_expires_at?: number | null;
}


interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  exchangeSession: (sessionId: string) => Promise<void>;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => Promise<void>;
  connectNotion: () => Promise<void>;
  disconnectNotion: () => Promise<void>;

  // Backward compatibility
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  userPicture: string | null;
  isCalendarConnected: boolean;
  googleCalendarToken: string | null;
  googleAccessToken: string | null;
  checkAuth: () => Promise<boolean>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const isAuthRef = useRef(false);

  useEffect(() => {
    isAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Initialize Store and restore session
  useEffect(() => {
    const initStore = async () => {
      try {
        const s = await Store.load("auth.json");
        setStore(s);

        const savedAuth = await s.get<AuthData>("auth");
        if (savedAuth && savedAuth.accessToken) {
          setToken(savedAuth.accessToken);
          setUser(savedAuth.user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error("Failed to init auth store:", e);
      } finally {
        setIsLoading(false);
      }
    };
    initStore();
  }, []);

  // Listen for Deep Links (Production)
  useEffect(() => {
    if (!store) return;

    const setupListener = async () => {
      const unlisten = await listen<string>("auth-callback", (event) => {
        console.log("Deep link received:", event.payload);
        const url = event.payload;
        try {
          const urlObj = new URL(url);
          const sessionId = urlObj.searchParams.get("session");
          if (sessionId) {
            exchangeSession(sessionId);
          }
        } catch (e) {
          console.error("Failed to parse deep link:", e);
        }
      });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unlistenPromise.then(unlisten => unlisten());
    };
  }, [store]);

  const login = async () => {
    const baseUrl = import.meta.env.PROD
      ? "https://primerai.vercel.app"
      : "http://localhost:3000";

    // Generate Poll ID
    const pollId = crypto.randomUUID();

    const loginUrl = `${baseUrl}/auth/login?source=desktop&poll_id=${pollId}`;
    console.log("Opening login URL:", loginUrl);
    await open(loginUrl);

    // Start polling in background, passing current auth state to detect new auth completion
    pollForSession(pollId, baseUrl, isAuthenticated);
  };

  const pollForSession = async (pollId: string, baseUrl: string, wasAlreadyAuthenticated: boolean) => {
    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    let authCompletedThisCycle = false;

    console.log("Starting poll for session:", pollId, "wasAlreadyAuthenticated:", wasAlreadyAuthenticated);

    while (Date.now() - startTime < timeout) {
      // Only stop early if auth was completed during THIS polling cycle
      // This allows re-authentication when user is already logged in but wants to connect Google
      if (authCompletedThisCycle) {
        console.log("Poll stopped: Auth completed this cycle");
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/auth/poll?poll_id=${pollId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            console.log("Session found via poll:", data.session);
            await exchangeSession(data.session);
            authCompletedThisCycle = true;
            return;
          }
        }
      } catch (e) {
        console.error("Poll error (will retry):", e);
      }

      // Wait 2 seconds before next poll
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Polling timed out");
  };

  const exchangeSession = async (sessionId: string) => {
    if (!store) return;

    try {
      setIsLoading(true);
      const baseUrl = import.meta.env.PROD
        ? "https://primerai.vercel.app"
        : "http://localhost:3000";

      const res = await fetch(`${baseUrl}/api/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionId }),
      });

      if (!res.ok) {
        throw new Error("Auth exchange failed");
      }

      const data: AuthData = await res.json();

      await store.set("auth", data);
      await store.save();

      setToken(data.accessToken);
      setUser(data.user);
      setIsAuthenticated(true);

      // Sync session to SQLite for calendar and other Tauri-side features
      try {
        // Calculate expires_at (default to 7 days from now if not provided)
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

        await invoke("sync_session", {
          dto: {
            user_id: data.user.id,
            access_token: data.accessToken,
            expires_at: expiresAt,
            google_access_token: data.google_access_token || null,
            google_refresh_token: data.google_refresh_token || null,
            google_token_expires_at: data.google_token_expires_at || null,
          }
        });
        console.log("Session synced to SQLite");
      } catch (syncError) {
        console.error("Failed to sync session to SQLite:", syncError);
        // Don't fail the whole exchange if sync fails
      }

    } catch (error) {
      console.error("Exchange session error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    if (!store) return;
    try {
      await store.delete("auth");
      await store.save();
      await invoke("clear_session");
    } catch (e) {
      console.error("Logout error:", e);
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAuth = async () => {
    // Already handled by state/store sync
    return isAuthenticated;
  };

  // Connect Google Calendar (separate from login)
  const connectGoogleCalendar = async () => {
    if (!user?.id) {
      console.error("Cannot connect calendar: user not logged in");
      return;
    }

    const baseUrl = import.meta.env.PROD
      ? "https://primerai.vercel.app"
      : "http://localhost:3000";

    // Generate Poll ID
    const pollId = crypto.randomUUID();

    const calendarUrl = `${baseUrl}/auth/connect/calendar?source=desktop&poll_id=${pollId}&user_id=${user.id}`;
    console.log("Opening calendar connect URL:", calendarUrl);
    await open(calendarUrl);

    // Start polling in background
    pollForCalendarConnection(pollId, baseUrl);
  };

  const pollForCalendarConnection = async (pollId: string, baseUrl: string) => {
    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    console.log("Starting poll for calendar connection:", pollId);

    while (Date.now() - startTime < timeout) {
      try {
        const res = await fetch(`${baseUrl}/api/auth/poll?poll_id=${pollId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            console.log("Calendar session found via poll:", data.session);
            // Re-exchange to get updated user with calendar token
            await exchangeSession(data.session);
            return;
          }
        }
      } catch (e) {
        console.error("Calendar poll error (will retry):", e);
      }

      // Wait 2 seconds before next poll
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Calendar polling timed out");
  };

  // Connect Notion (separate from login)
  const connectNotion = async () => {
    if (!user?.id) {
      console.error("Cannot connect Notion: user not logged in");
      return;
    }

    const baseUrl = import.meta.env.PROD
      ? "https://primerai.vercel.app"
      : "http://localhost:3000";

    // Generate Poll ID
    const pollId = crypto.randomUUID();

    const notionUrl = `${baseUrl}/auth/connect/notion?source=desktop&poll_id=${pollId}&user_id=${user.id}`;
    console.log("Opening Notion connect URL:", notionUrl);
    await open(notionUrl);

    // Start polling in background
    pollForNotionConnection(pollId, baseUrl);
  };

  const pollForNotionConnection = async (pollId: string, baseUrl: string) => {
    const startTime = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    console.log("Starting poll for Notion connection:", pollId);

    while (Date.now() - startTime < timeout) {
      try {
        const res = await fetch(`${baseUrl}/api/auth/poll?poll_id=${pollId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            console.log("Notion session found via poll:", data.session);
            // Don't need to exchange for Notion, just trigger a status refresh
            // The frontend will check notion status on window focus
            return;
          }
        }
      } catch (e) {
        console.error("Notion poll error (will retry):", e);
      }

      // Wait 2 seconds before next poll
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Notion polling timed out");
  };

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    if (!user?.id) {
      console.error("Cannot disconnect calendar: user not logged in");
      return;
    }

    const baseUrl = import.meta.env.PROD
      ? "https://primerai.vercel.app"
      : "http://localhost:3000";

    try {
      const res = await fetch(`${baseUrl}/api/auth/disconnect/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (res.ok) {
        // Update local state to reflect disconnection
        if (user && store) {
          const updatedUser = { ...user, isCalendarConnected: false, google_calendar_token: null };
          setUser(updatedUser);
          const savedAuth = await store.get<AuthData>("auth");
          if (savedAuth) {
            savedAuth.user = updatedUser;
            // Also clear the Google tokens from the auth data
            savedAuth.google_access_token = null;
            savedAuth.google_refresh_token = null;
            savedAuth.google_token_expires_at = null;
            await store.set("auth", savedAuth);
            await store.save();
          }
        }

        // Clear Google tokens from local SQLite session
        try {
          const savedAuth = await store?.get<AuthData>("auth");
          if (savedAuth) {
            await invoke("sync_session", {
              dto: {
                user_id: user.id,
                access_token: savedAuth.accessToken,
                expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
                google_access_token: null,
                google_refresh_token: null,
                google_token_expires_at: null,
              }
            });
            console.log("Local SQLite session updated to clear Google tokens");
          }
        } catch (syncError) {
          console.error("Failed to clear Google tokens from local session:", syncError);
        }

        console.log("Google Calendar disconnected successfully");
      } else {
        console.error("Failed to disconnect calendar");
      }
    } catch (e) {
      console.error("Disconnect calendar error:", e);
    }
  };

  // Disconnect Notion
  const disconnectNotion = async () => {
    if (!user?.id) {
      console.error("Cannot disconnect Notion: user not logged in");
      return;
    }

    const baseUrl = import.meta.env.PROD
      ? "https://primerai.vercel.app"
      : "http://localhost:3000";

    try {
      const res = await fetch(`${baseUrl}/api/auth/disconnect/notion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (res.ok) {
        console.log("Notion disconnected successfully");
        // The NotionTab will refresh status on next checkStatus call
      } else {
        console.error("Failed to disconnect Notion");
      }
    } catch (e) {
      console.error("Disconnect Notion error:", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        logout,
        exchangeSession,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        connectNotion,
        disconnectNotion,
        checkAuth,

        // Mapped properties for backward compatibility
        userId: user?.id || null,
        userEmail: user?.email || null,
        userName: user?.full_name || null,
        userPicture: user?.profile_picture || null,
        isCalendarConnected: user?.isCalendarConnected || false,
        googleCalendarToken: user?.google_calendar_token || null,
        googleAccessToken: user?.google_calendar_token || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

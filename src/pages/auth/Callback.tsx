import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";

interface GoogleLoginResponse {
  token: string;
  user_id: string;
}

interface ExchangeCodeResponse {
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
}

export default function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Skip if already processing or authenticated
    if (isProcessingRef.current) {
      return;
    }

    // If already authenticated, redirect to home
    if (isAuthenticated) {
      navigate("/home", { replace: true });
      return;
    }

    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      invoke("log_frontend_message", { message: "GoogleCallback: Component mounted, processing callback..." });

      // Authorization Code Flow: Extract 'code' from URL params
      let authCode = new URLSearchParams(location.search).get("code");

      if (!authCode) {
        // Try from hash (fallback)
        const hash = window.location.hash;
        invoke("log_frontend_message", { message: `GoogleCallback: Checking hash/search for code: ${hash}` });
        const params = new URLSearchParams(hash.replace(/^#\/?(auth\/callback)?\??/, ""));
        authCode = params.get("code");
      }

      invoke("log_frontend_message", { message: `GoogleCallback: Auth Code found: ${authCode ? "Yes" : "No"}` });

      if (!authCode) {
        setError("No authorization code found in URL. Please try logging in again.");
        isProcessingRef.current = false;
        return;
      }

      try {
        // Step 1: Exchange code for tokens via backend
        invoke("log_frontend_message", { message: "GoogleCallback: Exchanging code for tokens..." });
        const tokenResponse = await invoke<ExchangeCodeResponse>("exchange_google_code", {
          dto: { code: authCode },
        });

        invoke("log_frontend_message", {
          message: `GoogleCallback: Token exchange successful. Has refresh token: ${tokenResponse.refresh_token ? "Yes" : "No"}`
        });

        const accessToken = tokenResponse.access_token;
        const refreshToken = tokenResponse.refresh_token;
        const expiresIn = tokenResponse.expires_in;

        // Calculate expiration timestamp
        const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

        // Step 2: Fetch user info from Google using the access token
        invoke("log_frontend_message", { message: "GoogleCallback: Fetching user info from Google..." });
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user info from Google");
        }

        const userInfo = await response.json();
        invoke("log_frontend_message", { message: `GoogleCallback: User info received: ${userInfo.email}` });

        // Step 3: Call backend to login/register with all token info
        invoke("log_frontend_message", { message: "GoogleCallback: Invoking backend google_login..." });
        const loginResponse = await invoke<GoogleLoginResponse>("google_login", {
          dto: {
            email: userInfo.email,
            name: userInfo.name,
            google_id: userInfo.sub,
            picture: userInfo.picture,
            google_access_token: accessToken,
            google_refresh_token: refreshToken,
            google_token_expires_at: expiresAt,
          },
        });
        invoke("log_frontend_message", { message: `GoogleCallback: Backend login successful. UserID: ${loginResponse.user_id}` });

        // Use AuthContext to handle login
        login(loginResponse.token, loginResponse.user_id, userInfo.email, userInfo.name, userInfo.picture);
        invoke("log_frontend_message", { message: "GoogleCallback: AuthContext login called. Redirecting to /home..." });

        // Redirect to home immediately with replace to prevent back navigation
        navigate("/home", { replace: true });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        invoke("log_frontend_message", { message: `GoogleCallback Error: ${errorMsg}` });

        // Only show error if it's not an "already used" code error when we're already authenticated
        if (errorMsg.includes("invalid_grant")) {
          // Code was already used, just redirect
          navigate("/home", { replace: true });
        } else {
          setError(errorMsg);
          setTimeout(() => navigate("/login", { replace: true }), 3000);
        }
      }
    };

    handleCallback();
  }, [navigate, login, isAuthenticated, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div className="text-center">
        {error ? (
          <div className="text-red-400">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

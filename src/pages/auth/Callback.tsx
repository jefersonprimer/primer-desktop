import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useAuth } from "../../contexts/AuthContext";

interface GoogleLoginResponse {
  token: string;
  user_id: string;
}

export default function GoogleCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      invoke("log_frontend_message", { message: "GoogleCallback: Component mounted, processing callback..." });
      // Extract access_token from location search params (preferred for HashRouter)
      // or fall back to parsing the hash directly
      let accessToken = new URLSearchParams(location.search).get("access_token");

      if (!accessToken) {
        const hash = window.location.hash;
        invoke("log_frontend_message", { message: `GoogleCallback: Checking hash for token: ${hash}` });
        // Handle cases like #access_token=... or #/auth/callback#access_token=...
        const params = new URLSearchParams(hash.replace(/^#\/?(auth\/callback)?/, ""));
        accessToken = params.get("access_token");
      }

      invoke("log_frontend_message", { message: `GoogleCallback: Access Token found: ${accessToken ? "Yes" : "No"}` });

      if (!accessToken) {
        setError("No access token found in URL");
        return;
      }

      try {
        invoke("log_frontend_message", { message: "GoogleCallback: Fetching user info from Google..." });
        // Fetch user info from Google
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

        // Call backend to login/register
        invoke("log_frontend_message", { message: "GoogleCallback: Invoking backend google_login..." });
        const loginResponse = await invoke<GoogleLoginResponse>("google_login", {
          dto: {
            email: userInfo.email,
            name: userInfo.name,
            google_id: userInfo.sub,
            picture: userInfo.picture,
            google_access_token: accessToken,
          },
        });
        invoke("log_frontend_message", { message: `GoogleCallback: Backend login successful. UserID: ${loginResponse.user_id}` });

        // Use AuthContext to handle login
        login(loginResponse.token, loginResponse.user_id, userInfo.email, userInfo.name, userInfo.picture);
        invoke("log_frontend_message", { message: "GoogleCallback: AuthContext login called. Redirecting to /home..." });

        // Redirect to home with a small delay to ensure state updates propagate
        setTimeout(() => {
          navigate("/home");
        }, 100);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Authentication failed";
        invoke("log_frontend_message", { message: `GoogleCallback Error: ${errorMsg}` });
        setError(errorMsg);
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate, login]);

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

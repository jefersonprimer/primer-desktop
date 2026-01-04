import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { exchangeSession, isAuthenticated } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home", { replace: true });
      return;
    }

    if (processedRef.current) return;

    const params = new URLSearchParams(location.search);
    const session = params.get("session");

    if (session) {
      processedRef.current = true;
      exchangeSession(session).then(() => {
        navigate("/home", { replace: true });
      });
    } else {
      // If no session provided in URL, redirect to login
      navigate("/login", { replace: true });
    }
  }, [location, exchangeSession, navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
}
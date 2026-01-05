import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import WelcomePage from "../pages/welcome";
import HomePage from "../pages/home";

function SplashHandler() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      invoke("close_splashscreen").catch(console.error);
    }
  }, [isLoading]);

  return null;
}

function AuthRedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = ["/", "/welcome"].includes(
      location.pathname
    );

    const logMessage = `AuthRedirectHandler: pathname=${location.pathname}, isAuthenticated=${isAuthenticated}, isPublicRoute=${isPublicRoute}`;
    invoke("log_frontend_message", { message: logMessage }).catch(console.error);

    if (isAuthenticated && (location.pathname === "/" || location.pathname === "/welcome")) {
      invoke("log_frontend_message", { message: "Redirecting to /home (Authenticated)" }).catch(console.error);
      navigate("/home", { replace: true });
    } else if (!isAuthenticated && !isPublicRoute) {
      invoke("log_frontend_message", { message: "Redirecting to /welcome (Not authenticated)" }).catch(console.error);
      navigate("/welcome", { replace: true });
    }
  }, [location.pathname, isAuthenticated, isLoading, navigate]);

  return null;
}

function RootRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />;
}

export default function AppRoutes() {
  const { isLoading } = useAuth();

  return (
    <>
      <SplashHandler />
      <AuthRedirectHandler />
      {!isLoading && (
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      )}
    </>
  );
}
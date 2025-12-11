import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import WelcomeModal from "../components/WelcomoModal.tsx";
import ProtectedRoute from "../components/ProtectedRoute";
import LoginPage from "../pages/login";
import RegisterPage from "../pages/register";
import ForgotPassword from "../pages/forgot-password";
import ResetPassword from "../pages/reset-password";
import HomePage from "../pages/home";
import { useAuth } from "../contexts/AuthContext";

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
    if (isLoading) return; // Don't redirect while loading

    // Check authentication on route changes
    const isPublicRoute = ["/", "/login", "/register", "/forgot-password"].includes(
      location.pathname
    ) || location.pathname.startsWith("/reset-password");

    if (isAuthenticated && location.pathname === "/") {
      // User is logged in and on welcome page, redirect to home
      navigate("/home", { replace: true });
    } else if (!isAuthenticated && !isPublicRoute) {
      // User is not logged in and trying to access protected route
      navigate("/login", { replace: true });
    }
  }, [location.pathname, isAuthenticated, isLoading, navigate]);

  return null;
}

function RootRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <WelcomeModal />;
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />   
        </Routes>
      )}
    </>
  );
}
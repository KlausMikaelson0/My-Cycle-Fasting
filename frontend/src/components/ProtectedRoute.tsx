import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasSelectedLanguage, t } = useLanguage();

  if (!hasSelectedLanguage) {
    return <Navigate to="/language" replace />;
  }

  if (isLoading) {
    return <div className="page-shell">{t("status.loading")}</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasSelectedLanguage, t } = useLanguage();

  if (!hasSelectedLanguage) {
    return <Navigate to="/language" replace />;
  }

  if (isLoading) {
    return <div className="page-shell">{t("status.loading")}</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

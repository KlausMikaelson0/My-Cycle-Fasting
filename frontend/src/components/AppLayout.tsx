import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="app-layout">
      <header className="topbar">
        <Link to="/" className="brand">
          {t("app.name")}
        </Link>
        <nav className="topnav">
          <NavLink to="/">{t("nav.home")}</NavLink>
          <NavLink to="/calendar">{t("nav.calendar")}</NavLink>
          <NavLink to="/settings">{t("nav.settings")}</NavLink>
        </nav>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          {t("nav.logout")}
        </button>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}

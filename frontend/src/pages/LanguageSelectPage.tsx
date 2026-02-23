import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { updateMe } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Language } from "../i18n";

export function LanguageSelectPage() {
  const navigate = useNavigate();
  const { t, setLanguage, hasSelectedLanguage } = useLanguage();
  const { isAuthenticated, user, updateUserLocally } = useAuth();
  const [saving, setSaving] = useState(false);

  if (hasSelectedLanguage && !saving) {
    return <Navigate to={isAuthenticated ? "/" : "/login"} replace />;
  }

  const handleSelect = async (language: Language) => {
    setLanguage(language);

    if (isAuthenticated && user) {
      setSaving(true);
      try {
        const nextUser = await updateMe({ language });
        updateUserLocally(nextUser);
      } finally {
        setSaving(false);
      }
    }

    navigate(isAuthenticated ? "/" : "/login", { replace: true });
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>{t("app.name")}</h1>
        <h2>{t("language.selectTitle")}</h2>
        <p className="muted">{t("language.selectSubtitle")}</p>
        <div className="stack">
          <button type="button" className="btn btn-primary" onClick={() => handleSelect("ar")}>
            العربية
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => handleSelect("en")}>
            English
          </button>
        </div>
      </div>
    </div>
  );
}

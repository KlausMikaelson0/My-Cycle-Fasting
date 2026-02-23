import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Language } from "../i18n";
import { getApiErrorMessage } from "../utils/apiError";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ email, password, language: selectedLanguage });
      navigate("/", { replace: true });
    } catch (error) {
      setError(getApiErrorMessage(error, t("status.error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>{t("auth.registerTitle")}</h1>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            {t("auth.email")}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            {t("auth.password")}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            {t("auth.language")}
            <select
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value as Language)}
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {t("button.register")}
          </button>
        </form>

        <Link to="/login" className="inline-link">
          {t("auth.haveAccount")}
        </Link>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

import { useLanguage } from "../context/LanguageContext";

export function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <div className="stack">
      <h1>404</h1>
      <p>{t("status.error")}</p>
      <Link to="/" className="btn btn-primary">
        {t("nav.home")}
      </Link>
    </div>
  );
}

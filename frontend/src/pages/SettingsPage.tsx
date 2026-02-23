import { useEffect, useState } from "react";

import { updateMe } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Language } from "../i18n";
import { getApiErrorMessage } from "../utils/apiError";

export function SettingsPage() {
  const { user, updateUserLocally } = useAuth();
  const { t, setLanguage } = useLanguage();
  const [language, setLanguageState] = useState<Language>("en");
  const [locationType, setLocationType] = useState<"gps" | "manual">("manual");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [cityName, setCityName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLanguageState(user.language);
    setLocationType(user.locationType);
    setLatitude(user.latitude);
    setLongitude(user.longitude);
    setCityName(user.cityName ?? "");
  }, [user]);

  const readCurrentLocation = async () => {
    setMessage(null);
    if (!navigator.geolocation) {
      setMessage(t("settings.requestLocationFailed"));
      return;
    }

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setMessage(t("settings.locationReadSuccess"));
          resolve();
        },
        () => {
          setMessage(t("settings.requestLocationFailed"));
          resolve();
        },
      );
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (locationType === "gps" && (latitude === undefined || longitude === undefined)) {
        setMessage(t("settings.locationGpsRequired"));
        return;
      }

      if (locationType === "manual" && !cityName.trim()) {
        setMessage(t("settings.locationCityRequired"));
        return;
      }

      const payload: {
        language: Language;
        locationType: "gps" | "manual";
        latitude?: number;
        longitude?: number;
        cityName?: string;
      } = {
        language,
        locationType,
      };

      if (locationType === "gps") {
        payload.latitude = latitude;
        payload.longitude = longitude;
      } else {
        payload.cityName = cityName.trim();
      }

      const nextUser = await updateMe(payload);
      updateUserLocally(nextUser);
      setLanguage(nextUser.language);
      setMessage(t("settings.saved"));
    } catch (error) {
      setMessage(getApiErrorMessage(error, t("status.error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="stack">
      <h1>{t("settings.title")}</h1>

      <section className="card">
        <h2>{t("settings.language")}</h2>
        <select
          value={language}
          onChange={(event) => {
            const nextLanguage = event.target.value as Language;
            setLanguageState(nextLanguage);
            setLanguage(nextLanguage);
          }}
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </section>

      <section className="card">
        <h2>{t("settings.location")}</h2>
        <label className="inline-checkbox">
          <input
            type="radio"
            checked={locationType === "gps"}
            onChange={() => setLocationType("gps")}
          />
          {t("settings.location.useGps")}
        </label>
        <label className="inline-checkbox">
          <input
            type="radio"
            checked={locationType === "manual"}
            onChange={() => setLocationType("manual")}
          />
          {t("settings.location.manualCity")}
        </label>

        {locationType === "gps" ? (
          <div className="stack">
            <button type="button" className="btn btn-secondary" onClick={() => void readCurrentLocation()}>
              {t("settings.location.useGps")}
            </button>
            <p className="muted">
              Lat: {latitude ?? "-"} | Lng: {longitude ?? "-"}
            </p>
          </div>
        ) : (
          <label>
            {t("settings.location.manualCity")}
            <input
              type="text"
              value={cityName}
              onChange={(event) => setCityName(event.target.value)}
              placeholder={t("settings.location.cityPlaceholder")}
            />
          </label>
        )}
      </section>

      <section className="card">
        <h2>{t("settings.calculationTitle")}</h2>
        <p>{t("settings.calculationText")}</p>
      </section>

      <section className="card">
        <h2>{t("settings.notifications")}</h2>
        <p>{t("settings.notificationsText")}</p>
      </section>

      {message ? <p className="muted">{message}</p> : null}

      <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {t("button.save")}
      </button>
    </div>
  );
}

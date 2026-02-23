import { FormEvent, useEffect, useState } from "react";

import { useLanguage } from "../context/LanguageContext";
import { getApiErrorMessage } from "../utils/apiError";
import { combineDateTimeToIso, toDateInputValue, toTimeInputValue } from "../utils/datetime";
import { Modal } from "./Modal";

interface PeriodFormModalProps {
  open: boolean;
  editing?: boolean;
  initialStartDateTime?: string;
  initialEndDateTime?: string;
  onClose: () => void;
  onSave: (payload: { startDateTime: string; endDateTime?: string | null }) => Promise<void>;
}

export function PeriodFormModal({
  open,
  editing = false,
  initialStartDateTime,
  initialEndDateTime,
  onClose,
  onSave,
}: PeriodFormModalProps) {
  const { t } = useLanguage();
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [withEndDate, setWithEndDate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const sourceStart = initialStartDateTime ? new Date(initialStartDateTime) : new Date();
    setStartDate(toDateInputValue(sourceStart));
    setStartTime(toTimeInputValue(sourceStart));

    if (initialEndDateTime) {
      const sourceEnd = new Date(initialEndDateTime);
      setEndDate(toDateInputValue(sourceEnd));
      setEndTime(toTimeInputValue(sourceEnd));
      setWithEndDate(true);
    } else {
      setEndDate("");
      setEndTime("");
      setWithEndDate(false);
    }
  }, [initialEndDateTime, initialStartDateTime, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const startDateTimeIso = combineDateTimeToIso(startDate, startTime);
      const payload: { startDateTime: string; endDateTime?: string | null } = {
        startDateTime: startDateTimeIso,
      };

      if (withEndDate && endDate && endTime) {
        const endDateTimeIso = combineDateTimeToIso(endDate, endTime);
        if (new Date(endDateTimeIso).getTime() < new Date(startDateTimeIso).getTime()) {
          setErrorMessage(t("form.period.invalidRange"));
          return;
        }
        payload.endDateTime = endDateTimeIso;
      } else if (editing) {
        payload.endDateTime = null;
      }

      await onSave(payload);
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("status.error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={editing ? t("form.period.titleEdit") : t("form.period.titleCreate")}
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          {t("form.period.startDate")}
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
        </label>
        <label>
          {t("form.period.startTime")}
          <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
        </label>

        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={withEndDate}
            onChange={(event) => setWithEndDate(event.target.checked)}
          />
          {t("button.endPeriod")}
        </label>

        {withEndDate ? (
          <>
            <label>
              {t("form.period.endDate")}
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required={withEndDate}
              />
            </label>
            <label>
              {t("form.period.endTime")}
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                required={withEndDate}
              />
            </label>
          </>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {t("button.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {t("button.save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { FormEvent, useEffect, useState } from "react";

import { FastingDayRecord } from "../types/models";
import { combineDateTimeToIso, formatLocalizedDate, toTimeInputValue } from "../utils/datetime";
import { useLanguage } from "../context/LanguageContext";
import { Modal } from "./Modal";

interface FastingFormModalProps {
  open: boolean;
  date: string;
  initialRecord?: FastingDayRecord | null;
  onClose: () => void;
  onSave: (payload: {
    date: string;
    isRamadanDay: boolean;
    isFasted: boolean;
    isQada: boolean;
    periodStartDateTime?: string;
  }) => Promise<void>;
}

export function FastingFormModal({
  open,
  date,
  initialRecord,
  onClose,
  onSave,
}: FastingFormModalProps) {
  const { t, language } = useLanguage();
  const [isFasted, setIsFasted] = useState(false);
  const [isRamadanDay, setIsRamadanDay] = useState(false);
  const [isQada, setIsQada] = useState(false);
  const [periodStartedToday, setPeriodStartedToday] = useState(false);
  const [periodStartTime, setPeriodStartTime] = useState("12:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsFasted(initialRecord?.isFasted ?? false);
    setIsRamadanDay(initialRecord?.isRamadanDay ?? false);
    setIsQada(initialRecord?.isQada ?? false);
    setPeriodStartedToday(Boolean(initialRecord?.periodStartDateTime));
    if (initialRecord?.periodStartDateTime) {
      setPeriodStartTime(toTimeInputValue(initialRecord.periodStartDateTime));
    } else {
      setPeriodStartTime("12:00");
    }
  }, [initialRecord, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await onSave({
        date,
        isFasted,
        isRamadanDay,
        isQada,
        periodStartDateTime: periodStartedToday
          ? combineDateTimeToIso(date, periodStartTime)
          : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title={t("form.fasting.title")} onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <p className="muted">{formatLocalizedDate(date, language)}</p>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={isFasted}
            onChange={(event) => setIsFasted(event.target.checked)}
          />
          {t("form.fasting.didFast")}
        </label>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={isRamadanDay}
            onChange={(event) => setIsRamadanDay(event.target.checked)}
          />
          {t("form.fasting.isRamadan")}
        </label>
        <label className="inline-checkbox">
          <input type="checkbox" checked={isQada} onChange={(event) => setIsQada(event.target.checked)} />
          {t("form.fasting.isQada")}
        </label>
        <label className="inline-checkbox">
          <input
            type="checkbox"
            checked={periodStartedToday}
            onChange={(event) => setPeriodStartedToday(event.target.checked)}
          />
          {t("form.fasting.periodStartedToday")}
        </label>

        {periodStartedToday ? (
          <label>
            {t("form.fasting.periodStartTime")}
            <input
              type="time"
              value={periodStartTime}
              onChange={(event) => setPeriodStartTime(event.target.value)}
              required
            />
          </label>
        ) : null}

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

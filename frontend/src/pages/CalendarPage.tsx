import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  deleteFastingDay,
  deletePeriod,
  fetchFastingRange,
  fetchPeriodSummary,
  fetchPeriods,
  updatePeriod,
  upsertFastingDay,
} from "../api/endpoints";
import { FastingFormModal } from "../components/FastingFormModal";
import { Modal } from "../components/Modal";
import { PeriodFormModal } from "../components/PeriodFormModal";
import { useLanguage } from "../context/LanguageContext";
import { FastingDayRecord, PeriodRecord, PeriodSummary } from "../types/models";
import { getApiErrorMessage } from "../utils/apiError";
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  toUtcDateKey,
} from "../utils/datetime";

function getCalendarDays(month: Dayjs): Dayjs[] {
  const start = month.startOf("month").startOf("week");
  const end = month.endOf("month").endOf("week");
  const days: Dayjs[] = [];
  let cursor = start;
  while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
    days.push(cursor);
    cursor = cursor.add(1, "day");
  }
  return days;
}

function isDateInPeriod(date: Dayjs, period: PeriodRecord): boolean {
  const start = dayjs(period.startDateTime).startOf("day");
  const end = period.endDateTime ? dayjs(period.endDateTime).startOf("day") : dayjs().startOf("day");
  return (date.isAfter(start) || date.isSame(start, "day")) && (date.isBefore(end) || date.isSame(end, "day"));
}

export function CalendarPage() {
  const { t, language } = useLanguage();
  const [month, setMonth] = useState(dayjs().startOf("month"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);
  const [fastingDays, setFastingDays] = useState<FastingDayRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openFastingModal, setOpenFastingModal] = useState(false);
  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PeriodRecord | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = month.startOf("month").format("YYYY-MM-DD");
      const endDate = month.endOf("month").format("YYYY-MM-DD");
      const [periodSummaryData, periodsData, fastingData] = await Promise.all([
        fetchPeriodSummary(),
        fetchPeriods(),
        fetchFastingRange({ startDate, endDate }),
      ]);
      setPeriodSummary(periodSummaryData);
      setPeriods(periodsData);
      setFastingDays(fastingData);
    } catch (refreshError) {
      setError(getApiErrorMessage(refreshError, t("status.error")));
    } finally {
      setLoading(false);
    }
  }, [month, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const fastingMap = useMemo(() => {
    const map = new Map<string, FastingDayRecord>();
    fastingDays.forEach((day) => {
      map.set(toUtcDateKey(day.date), day);
    });
    return map;
  }, [fastingDays]);

  const days = useMemo(() => getCalendarDays(month), [month]);
  const nextExpected = periodSummary?.nextExpectedPeriodStartDate
    ? dayjs(periodSummary.nextExpectedPeriodStartDate).startOf("day")
    : null;

  const selectedFasting = selectedDate ? fastingMap.get(selectedDate) ?? null : null;
  const selectedPeriodRange = selectedDate
    ? periods.find((period) => isDateInPeriod(dayjs(selectedDate), period)) ?? null
    : null;

  const selectedPeriodDay = useMemo(() => {
    if (!selectedDate || !selectedPeriodRange) return null;
    return dayjs(selectedDate).startOf("day").diff(dayjs(selectedPeriodRange.startDateTime).startOf("day"), "day") + 1;
  }, [selectedDate, selectedPeriodRange]);

  const handleSaveFasting = async (payload: {
    date: string;
    isRamadanDay: boolean;
    isFasted: boolean;
    isQada: boolean;
    periodStartDateTime?: string;
  }) => {
    await upsertFastingDay(payload);
    await refresh();
  };

  const handleDeleteFasting = async () => {
    try {
      if (!selectedFasting) return;
      await deleteFastingDay(selectedFasting._id);
      await refresh();
      setSelectedDate(null);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, t("status.error")));
    }
  };

  const handleDeletePeriod = async () => {
    try {
      if (!selectedPeriodRange) return;
      await deletePeriod(selectedPeriodRange._id);
      await refresh();
      setSelectedDate(null);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, t("status.error")));
    }
  };

  const handleSavePeriod = async (payload: { startDateTime: string; endDateTime?: string | null }) => {
    if (!editingPeriod) return;
    await updatePeriod(editingPeriod._id, payload);
    await refresh();
  };

  return (
    <div className="stack">
      <h1>{t("calendar.title")}</h1>
      <div className="calendar-toolbar">
        <button type="button" className="btn btn-ghost" onClick={() => setMonth((value) => value.subtract(1, "month"))}>
          ←
        </button>
        <strong>
          {month.format("MMMM")} {month.year()}
        </strong>
        <button type="button" className="btn btn-ghost" onClick={() => setMonth((value) => value.add(1, "month"))}>
          →
        </button>
      </div>

      {loading ? <p>{t("status.loading")}</p> : null}
      {error ? (
        <div className="button-row">
          <p className="error-text">{error}</p>
          <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
            {t("button.retry")}
          </button>
        </div>
      ) : null}

      <div className="calendar-weekdays">
        <span>{t("calendar.weekday.sun")}</span>
        <span>{t("calendar.weekday.mon")}</span>
        <span>{t("calendar.weekday.tue")}</span>
        <span>{t("calendar.weekday.wed")}</span>
        <span>{t("calendar.weekday.thu")}</span>
        <span>{t("calendar.weekday.fri")}</span>
        <span>{t("calendar.weekday.sat")}</span>
      </div>

      <div className="calendar-grid">
        {days.map((day) => {
          const key = day.format("YYYY-MM-DD");
          const inCurrentMonth = day.month() === month.month();
          const fastingDay = fastingMap.get(key);
          const inPeriod = periods.some((period) => isDateInPeriod(day, period));
          const predicted =
            nextExpected !== null && Math.abs(day.startOf("day").diff(nextExpected.startOf("day"), "day")) <= 2;

          let tileClass = "calendar-day";
          if (inPeriod) tileClass += " day-period";
          else if (fastingDay?.isFasted && !fastingDay.isQada) tileClass += " day-fasting";
          else if (fastingDay?.isFasted && fastingDay.isQada) tileClass += " day-qada";
          else if (predicted) tileClass += " day-predicted";
          if (!inCurrentMonth) tileClass += " day-outside";

          return (
            <button
              key={key}
              type="button"
              className={tileClass}
              onClick={() => setSelectedDate(key)}
            >
              {day.date()}
            </button>
          );
        })}
      </div>

      <Modal
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate(null)}
        variant="bottom"
        title={t("calendar.detailTitle")}
      >
        {selectedDate ? (
          <div className="stack">
            <p>{formatLocalizedDate(selectedDate, language)}</p>
            {selectedPeriodDay ? <p>{t("calendar.periodDay", { count: selectedPeriodDay })}</p> : null}
            {selectedFasting ? (
              <>
                <p>{selectedFasting.isRamadanDay ? t("calendar.ramadanDay") : "-"}</p>
                <p>{selectedFasting.isQada ? t("calendar.qadaDay") : "-"}</p>
                <p>{selectedFasting.isFasted ? t("calendar.fasted") : t("calendar.notFasted")}</p>
                {selectedFasting.periodStartDateTime ? (
                  <p>
                    {t("calendar.periodStartedAt")}:{" "}
                    {formatLocalizedDateTime(selectedFasting.periodStartDateTime, language)}
                  </p>
                ) : null}
                {selectedFasting.fajrTime ? (
                  <p>
                    {t("calendar.fajr")}: {formatLocalizedDateTime(selectedFasting.fajrTime, language)}
                  </p>
                ) : null}
                {selectedFasting.maghribTime ? (
                  <p>
                    {t("calendar.maghrib")}: {formatLocalizedDateTime(selectedFasting.maghribTime, language)}
                  </p>
                ) : null}
              </>
            ) : (
              <p>{t("calendar.noData")}</p>
            )}

            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={() => setOpenFastingModal(true)}>
                {t("button.edit")}
              </button>
              {selectedFasting ? (
                <button type="button" className="btn btn-danger" onClick={handleDeleteFasting}>
                  {t("button.delete")}
                </button>
              ) : null}
            </div>

            {selectedPeriodRange ? (
              <div className="button-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingPeriod(selectedPeriodRange);
                    setOpenPeriodModal(true);
                  }}
                >
                  {t("button.edit")} {t("home.periodCard.title")}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeletePeriod}>
                  {t("button.delete")} {t("home.periodCard.title")}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {selectedDate ? (
        <FastingFormModal
          open={openFastingModal}
          date={selectedDate}
          initialRecord={selectedFasting}
          onClose={() => setOpenFastingModal(false)}
          onSave={handleSaveFasting}
        />
      ) : null}

      <PeriodFormModal
        open={openPeriodModal}
        editing
        initialStartDateTime={editingPeriod?.startDateTime}
        initialEndDateTime={editingPeriod?.endDateTime}
        onClose={() => {
          setOpenPeriodModal(false);
          setEditingPeriod(null);
        }}
        onSave={handleSavePeriod}
      />
    </div>
  );
}

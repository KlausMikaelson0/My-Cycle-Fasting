import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createPeriod,
  fetchFastingRange,
  fetchFastingSummary,
  fetchPeriodSummary,
  fetchPeriods,
  updatePeriod,
  upsertFastingDay,
} from "../api/endpoints";
import { FastingFormModal } from "../components/FastingFormModal";
import { PeriodFormModal } from "../components/PeriodFormModal";
import { useLanguage } from "../context/LanguageContext";
import { FastingDayRecord, FastingSummary, PeriodRecord, PeriodSummary } from "../types/models";
import { formatDateForApi } from "../utils/datetime";

export function HomePage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodSummary, setPeriodSummary] = useState<PeriodSummary | null>(null);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [fastingSummary, setFastingSummary] = useState<FastingSummary | null>(null);
  const [todayFastingRecord, setTodayFastingRecord] = useState<FastingDayRecord | null>(null);
  const [openPeriodModal, setOpenPeriodModal] = useState(false);
  const [openFastingModal, setOpenFastingModal] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getUTCFullYear();
      const todayDate = formatDateForApi(new Date());

      const [periodSummaryData, periodsData, fastingSummaryData, fastingTodayData] = await Promise.all([
        fetchPeriodSummary(),
        fetchPeriods(),
        fetchFastingSummary(currentYear),
        fetchFastingRange({ startDate: todayDate, endDate: todayDate }),
      ]);

      setPeriodSummary(periodSummaryData);
      setPeriods(periodsData);
      setFastingSummary(fastingSummaryData);
      setTodayFastingRecord(fastingTodayData[0] ?? null);
    } catch {
      setError(t("status.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activePeriod = useMemo(() => {
    if (periodSummary?.activePeriod) {
      return periodSummary.activePeriod;
    }
    const fromList = periods.find((period) => !period.endDateTime);
    if (!fromList) return null;
    return {
      id: fromList._id,
      startDateTime: fromList.startDateTime,
      endDateTime: fromList.endDateTime,
    };
  }, [periodSummary, periods]);

  const periodDayNumber = useMemo(() => {
    if (!activePeriod) return null;
    const start = dayjs(activePeriod.startDateTime).startOf("day");
    const today = dayjs().startOf("day");
    return today.diff(start, "day") + 1;
  }, [activePeriod]);

  const nextExpectedInDays = useMemo(() => {
    if (!periodSummary?.nextExpectedPeriodStartDate) return null;
    const today = dayjs().startOf("day");
    const nextExpected = dayjs(periodSummary.nextExpectedPeriodStartDate).startOf("day");
    return nextExpected.diff(today, "day");
  }, [periodSummary]);

  const handleCreatePeriod = async (payload: { startDateTime: string; endDateTime?: string | null }) => {
    const created = await createPeriod({ startDateTime: payload.startDateTime });
    if (payload.endDateTime) {
      await updatePeriod(created._id, { endDateTime: payload.endDateTime });
    }
    await refresh();
  };

  const handleEndPeriodNow = async () => {
    if (!activePeriod) return;
    await updatePeriod(activePeriod.id, { endDateTime: new Date().toISOString() });
    await refresh();
  };

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

  const todayDate = formatDateForApi(new Date());

  if (loading) {
    return <div>{t("status.loading")}</div>;
  }

  if (error) {
    return <div className="error-text">{error}</div>;
  }

  return (
    <div className="stack">
      <h1>{t("home.title")}</h1>

      <section className="card">
        <h2>{t("home.periodCard.title")}</h2>
        {activePeriod ? (
          <>
            <p>{t("home.periodCard.activeMessage")}</p>
            <p>{t("home.periodCard.dayOfPeriod", { count: periodDayNumber ?? 1 })}</p>
          </>
        ) : (
          <>
            <p>{t("home.periodCard.noActive")}</p>
            {nextExpectedInDays !== null ? (
              <p>{t("home.periodCard.nextExpectedIn", { count: nextExpectedInDays })}</p>
            ) : (
              <p>{t("home.periodCard.nextExpectedUnknown")}</p>
            )}
          </>
        )}
        <div className="button-row">
          <button type="button" className="btn btn-period" onClick={() => setOpenPeriodModal(true)}>
            {t("button.startPeriod")}
          </button>
          {activePeriod ? (
            <button type="button" className="btn btn-secondary" onClick={handleEndPeriodNow}>
              {t("button.endPeriod")}
            </button>
          ) : null}
        </div>
      </section>

      <section className="card">
        <h2>{t("home.fastingCard.title")}</h2>
        <p>{t("home.fastingCard.ramadanDaysFasted", { count: fastingSummary?.ramadanDaysFasted ?? 0 })}</p>
        <p>{t("home.fastingCard.missed", { count: fastingSummary?.missedDaysInRamadan ?? 0 })}</p>
        <p>{t("home.fastingCard.qadaDone", { count: fastingSummary?.qadaDaysDone ?? 0 })}</p>
        <p>{t("home.fastingCard.remaining", { count: fastingSummary?.remainingQada ?? 0 })}</p>
        {fastingSummary ? <p className="muted">{t("home.fastingCard.summaryYear", { year: fastingSummary.year })}</p> : null}
        <div className="button-row">
          <button type="button" className="btn btn-fasting" onClick={() => setOpenFastingModal(true)}>
            {t("button.logFast")}
          </button>
        </div>
      </section>

      <PeriodFormModal
        open={openPeriodModal}
        onClose={() => setOpenPeriodModal(false)}
        onSave={handleCreatePeriod}
      />

      <FastingFormModal
        open={openFastingModal}
        date={todayDate}
        initialRecord={todayFastingRecord}
        onClose={() => setOpenFastingModal(false)}
        onSave={handleSaveFasting}
      />
    </div>
  );
}

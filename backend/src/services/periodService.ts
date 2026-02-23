import { diffInDays } from "../utils/date";

interface PeriodLike {
  _id?: unknown;
  startDateTime: Date;
  endDateTime?: Date;
}

export function calculateAverageCycleLength(periods: Pick<PeriodLike, "startDateTime">[]): number | null {
  if (periods.length < 2) {
    return null;
  }

  const sorted = [...periods].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );

  const cycleDiffs: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    if (!previous || !current) continue;

    const days = diffInDays(previous.startDateTime, current.startDateTime);
    if (days > 0) {
      cycleDiffs.push(days);
    }
  }

  if (!cycleDiffs.length) {
    return null;
  }

  const total = cycleDiffs.reduce((sum, value) => sum + value, 0);
  return Math.round(total / cycleDiffs.length);
}

export function calculateNextExpectedPeriodStartDate(
  lastPeriodStartDate: Date | null,
  averageCycleLength: number | null,
): Date | null {
  if (!lastPeriodStartDate || !averageCycleLength) {
    return null;
  }

  return new Date(lastPeriodStartDate.getTime() + averageCycleLength * 24 * 60 * 60 * 1000);
}

export function buildPeriodSummary(periods: PeriodLike[]) {
  const sorted = [...periods].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );

  const lastPeriod = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const averageCycleLength = calculateAverageCycleLength(sorted);
  const lastPeriodStartDate = lastPeriod?.startDateTime ?? null;
  const nextExpectedPeriodStartDate = calculateNextExpectedPeriodStartDate(
    lastPeriodStartDate,
    averageCycleLength,
  );

  return {
    averageCycleLength,
    lastPeriodStartDate,
    nextExpectedPeriodStartDate,
    activePeriod:
      lastPeriod && !lastPeriod.endDateTime
        ? {
            id: String(lastPeriod._id ?? ""),
            startDateTime: lastPeriod.startDateTime,
            endDateTime: lastPeriod.endDateTime,
          }
        : null,
  };
}

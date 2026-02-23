import { IFastingDay } from "../models/FastingDay";

type FastingValidationInput = Pick<
  IFastingDay,
  "isFasted" | "periodStartDateTime" | "fajrTime" | "maghribTime"
>;

export function isFastValid(fastingDay: FastingValidationInput): boolean {
  if (!fastingDay.isFasted) return false;
  if (!fastingDay.periodStartDateTime || !fastingDay.fajrTime || !fastingDay.maghribTime) return true;

  // If period starts between fajr and maghrib, fast is invalid.
  return (
    fastingDay.periodStartDateTime < fastingDay.fajrTime ||
    fastingDay.periodStartDateTime >= fastingDay.maghribTime
  );
}

export function buildFastingSummary(days: IFastingDay[]) {
  const ramadanDays = days
    .filter((day) => day.isRamadanDay)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const ramadanDaysFasted = ramadanDays.filter((day) => isFastValid(day)).length;
  const missedDaysInRamadan = ramadanDays.filter((day) => !isFastValid(day)).length;

  const lastRamadanDate = ramadanDays.length ? ramadanDays[ramadanDays.length - 1].date : null;
  const qadaDaysDone = days.filter((day) => {
    if (!day.isQada || day.isRamadanDay || !isFastValid(day)) {
      return false;
    }

    // Qada should be counted after Ramadan when we have Ramadan records.
    if (lastRamadanDate) {
      return day.date.getTime() > lastRamadanDate.getTime();
    }

    return true;
  }).length;

  const remainingQada = Math.max(missedDaysInRamadan - qadaDaysDone, 0);

  return {
    ramadanDaysFasted,
    missedDaysInRamadan,
    qadaDaysDone,
    remainingQada,
  };
}

export function inferRamadanDay(date: Date): boolean {
  // TODO: Replace this with accurate Hijri-month detection for Ramadan.
  const month = date.getUTCMonth() + 1;
  return month === 3;
}

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
  const ramadanDaysFasted = days.filter((day) => day.isRamadanDay && isFastValid(day)).length;
  const missedDaysInRamadan = days.filter((day) => day.isRamadanDay && !isFastValid(day)).length;
  const qadaDaysDone = days.filter((day) => day.isQada && isFastValid(day)).length;
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

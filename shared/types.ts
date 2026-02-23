export type Language = "ar" | "en";
export type LocationType = "gps" | "manual";

export interface UserDto {
  id: string;
  email: string;
  language: Language;
  locationType: LocationType;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PeriodSummaryDto {
  averageCycleLength: number | null;
  lastPeriodStartDate: string | null;
  nextExpectedPeriodStartDate: string | null;
}

export interface FastingSummaryDto {
  year: number;
  ramadanDaysFasted: number;
  missedDaysInRamadan: number;
  qadaDaysDone: number;
  remainingQada: number;
}

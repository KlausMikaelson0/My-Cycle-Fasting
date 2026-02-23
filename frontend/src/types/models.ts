import { Language } from "../i18n";

export interface UserProfile {
  id: string;
  email: string;
  language: Language;
  locationType: "gps" | "manual";
  latitude?: number;
  longitude?: number;
  cityName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PeriodRecord {
  _id: string;
  userId: string;
  startDateTime: string;
  endDateTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodSummary {
  averageCycleLength: number | null;
  lastPeriodStartDate: string | null;
  nextExpectedPeriodStartDate: string | null;
  activePeriod: {
    id: string;
    startDateTime: string;
    endDateTime?: string;
  } | null;
}

export interface FastingDayRecord {
  _id: string;
  userId: string;
  date: string;
  isRamadanDay: boolean;
  isFasted: boolean;
  isQada: boolean;
  periodStartDateTime?: string;
  fajrTime?: string;
  maghribTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FastingSummary {
  year: number;
  ramadanDaysFasted: number;
  missedDaysInRamadan: number;
  qadaDaysDone: number;
  remainingQada: number;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

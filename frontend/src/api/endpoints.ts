import { apiClient } from "./client";
import {
  AuthResponse,
  FastingDayRecord,
  FastingSummary,
  PeriodRecord,
  PeriodSummary,
  UserProfile,
} from "../types/models";
import { Language } from "../i18n";

export async function register(payload: {
  email: string;
  password: string;
  language: Language;
}): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", payload);
  return response.data;
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
}

export async function fetchMe(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>("/user/me");
  return response.data;
}

export async function updateMe(payload: Partial<UserProfile>): Promise<UserProfile> {
  const response = await apiClient.put<UserProfile>("/user/me", payload);
  return response.data;
}

export async function fetchPeriods(): Promise<PeriodRecord[]> {
  const response = await apiClient.get<PeriodRecord[]>("/periods");
  return response.data;
}

export async function createPeriod(payload: { startDateTime: string }): Promise<PeriodRecord> {
  const response = await apiClient.post<PeriodRecord>("/periods", payload);
  return response.data;
}

export async function updatePeriod(
  id: string,
  payload: { startDateTime?: string; endDateTime?: string | null },
): Promise<PeriodRecord> {
  const response = await apiClient.put<PeriodRecord>(`/periods/${id}`, payload);
  return response.data;
}

export async function deletePeriod(id: string): Promise<void> {
  await apiClient.delete(`/periods/${id}`);
}

export async function fetchPeriodSummary(): Promise<PeriodSummary> {
  const response = await apiClient.get<PeriodSummary>("/periods/summary");
  return response.data;
}

export async function fetchFastingRange(params: {
  startDate?: string;
  endDate?: string;
}): Promise<FastingDayRecord[]> {
  const response = await apiClient.get<FastingDayRecord[]>("/fasting", { params });
  return response.data;
}

export async function upsertFastingDay(payload: {
  date: string;
  isRamadanDay?: boolean;
  isFasted: boolean;
  isQada: boolean;
  periodStartDateTime?: string;
}): Promise<FastingDayRecord> {
  const response = await apiClient.post<FastingDayRecord>("/fasting", payload);
  return response.data;
}

export async function updateFastingDay(
  id: string,
  payload: {
    date?: string;
    isRamadanDay?: boolean;
    isFasted?: boolean;
    isQada?: boolean;
    periodStartDateTime?: string | null;
  },
): Promise<FastingDayRecord> {
  const response = await apiClient.put<FastingDayRecord>(`/fasting/${id}`, payload);
  return response.data;
}

export async function deleteFastingDay(id: string): Promise<void> {
  await apiClient.delete(`/fasting/${id}`);
}

export async function fetchFastingSummary(year: number): Promise<FastingSummary> {
  const response = await apiClient.get<FastingSummary>("/fasting/summary", { params: { year } });
  return response.data;
}

import { normalizeDateOnly } from "../utils/date";

export interface PrayerTimesResult {
  fajrTime: Date;
  maghribTime: Date;
}

interface PrayerTimesParams {
  date: Date;
  latitude?: number;
  longitude?: number;
  cityName?: string;
}

export async function getPrayerTimes(params: PrayerTimesParams): Promise<PrayerTimesResult> {
  const normalizedDate = normalizeDateOnly(params.date);
  const fajrTime = new Date(normalizedDate);
  const maghribTime = new Date(normalizedDate);

  // TODO: integrate with a real prayer-times provider (via params.latitude/longitude or params.cityName)
  // and map provider response to fajrTime/maghribTime.
  fajrTime.setUTCHours(5, 0, 0, 0);
  maghribTime.setUTCHours(18, 0, 0, 0);

  return { fajrTime, maghribTime };
}

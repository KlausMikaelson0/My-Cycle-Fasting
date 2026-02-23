const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function normalizeDateOnly(value: Date | string): Date {
  const input = typeof value === "string" ? new Date(value) : new Date(value);
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function diffInDays(start: Date, end: Date): number {
  const normalizedStart = normalizeDateOnly(start);
  const normalizedEnd = normalizeDateOnly(end);
  return Math.round((normalizedEnd.getTime() - normalizedStart.getTime()) / MS_PER_DAY);
}

export function withinInclusiveRange(target: Date, start: Date, end: Date): boolean {
  const time = target.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function yearBoundaries(year: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

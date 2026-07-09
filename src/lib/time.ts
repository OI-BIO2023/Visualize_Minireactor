export const toIso = (value: string | number | Date | null | undefined): string | null => {
  if (value == null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const minutesBetween = (start: string, end: string): number => {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Number.isFinite(s) && Number.isFinite(e) ? (e - s) / 60000 : 0;
};

export const clampDateRange = (start: string, end: string, maxDays: number): { start: string; end: string } => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Invalid date range');
  }
  if (endDate <= startDate) {
    throw new Error('end must be after start');
  }
  const maxEnd = new Date(startDate.getTime() + maxDays * 24 * 60 * 60 * 1000);
  return { start: startDate.toISOString(), end: (endDate > maxEnd ? maxEnd : endDate).toISOString() };
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'kein Wert';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
};

export const hoursSince = (start: string, end: string): number => minutesBetween(start, end) / 60;

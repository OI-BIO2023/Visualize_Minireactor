export const DEFAULT_STALE_THRESHOLD_MINUTES = 60;

export const minutesSince = (timestamp: string | null | undefined, now = Date.now(): number | null => {
  if (!timestamp) return null;
  const parsed = new Date(timestamp).getTime();
  if (!Number.isFinite(parsed)) return null;
  return (now - parsed) / 60000;
};

export const isStale = (timestamp: string | null | undefined, thresholdMinutes = DEFAULT_STALE_THRESHOLD_MINUTES, now = Date.now()): boolean => {
  const ageMinutes = minutesSince(timestamp, now);
  return ageMinutes != null && ageMinutes > thresholdMinutes;
};

export const formatStaleDuration = (timestamp: string | null | undefined, now = Date.now()): string => {
  const ageMinutes = minutesSince(timestamp, now);
  if (ageMinutes == null) return 'unbekannt';
  if (ageMinutes < 60) return `${Math.round(ageMinutes)} min`;
  return `${(ageMinutes / 60).toFixed(1)} h`;
};

import { normalizeNumeric } from './quality';

const toPlainObject = (value: unknown): unknown => {
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(toPlainObject);
  const obj = value as Record<string, unknown>;
  if ('S' in obj || 'N' in obj || 'BOOL' in obj || 'NULL' in obj || 'M' in obj || 'L' in obj) {
    if ('S' in obj) return obj.S;
    if ('N' in obj) return normalizeNumeric(obj.N);
    if ('BOOL' in obj) return Boolean(obj.BOOL);
    if ('NULL' in obj) return null;
    if ('M' in obj) return toPlainObject(obj.M);
    if ('L' in obj) return (obj.L as unknown[]).map(toPlainObject);
  }
  return Object.fromEntries(Object.entries(obj).map(([key, current]) => [key, toPlainObject(current)]));
};

export type NormalizedRecord = Record<string, unknown> & {
  timestamp?: string;
};

export const normalizeDynamoPayload = (input: unknown): NormalizedRecord => {
  const raw =
    typeof input === 'string'
      ? (() => {
          try {
            return JSON.parse(input);
          } catch {
            return input;
          }
        })()
      : input;

  const normalized = toPlainObject(raw);
  if (typeof normalized === 'object' && normalized !== null && !Array.isArray(normalized)) {
    return normalized as NormalizedRecord;
  }
  return { value: normalized } as NormalizedRecord;
};

export const extractTimestamp = (record: NormalizedRecord): string | null => {
  const candidates = [record.timestamp, record.ts, record.created_at, record.createdAt, record.sk];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const cleaned = candidate.startsWith('TS#') ? candidate.slice(3).split('#')[0] : candidate;
    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return null;
};

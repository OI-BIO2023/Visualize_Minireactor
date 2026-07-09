export type QualityFlag =
  | 'stale'
  | 'missing'
  | 'outOfRange'
  | 'noBatch'
  | 'ambiguousGasAssignment';

export const normalizeNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(num) ? num : null;
};

export const isOutOfRange = (value: number | null, min?: number, max?: number): boolean => {
  if (value == null) return false;
  if (min != null && value < min) return true;
  if (max != null && value > max) return true;
  return false;
};

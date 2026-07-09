import { minutesBetween } from './time';
import { normalizeNumeric } from './quality';
import type { ReactorId } from '../config/reactors';

export type DataPoint = Record<string, unknown>;

export type Batch = {
  batch_id: string;
  reactor: ReactorId;
  fill_at: string;
  empty_at: string | null;
  biomass?: Record<string, unknown>;
  operator_notes?: string;
};

export type ReactorGasAssignment = ReactorId | 'unassigned' | 'ambiguous';

export const average = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export const biomassAverageTemperature = (row: DataPoint, reactor: ReactorId): number | null => {
  return average([
    normalizeNumeric(row[`T_oben_L_${reactor}`]),
    normalizeNumeric(row[`T_oben_R_${reactor}`]),
    normalizeNumeric(row[`T_unter_L_${reactor}`]),
    normalizeNumeric(row[`T_unter_R_${reactor}`]),
    normalizeNumeric(row[`T_Mittel_${reactor}`])
  ]);
};

export const temperatureGradient = (row: DataPoint, reactor: ReactorId): number | null => {
  const top = average([normalizeNumeric(row[`T_oben_L_${reactor}`]), normalizeNumeric(row[`T_oben_R_${reactor}`])]);
  const bottom = average([normalizeNumeric(row[`T_unter_L_${reactor}`]), normalizeNumeric(row[`T_unter_R_${reactor}`])]);
  if (top == null || bottom == null) return null;
  return top - bottom;
};

export const heatExtractionPowerKw = (flowLMin: number | null, tRl: number | null, tVl: number | null): number | null => {
  if (flowLMin == null || tRl == null || tVl == null) return null;
  const delta = tRl - tVl;
  return 4.186 * (flowLMin / 60) * delta;
};

export const integrateEnergyKwh = (points: Array<{ timestamp: string; powerKw: number | null }>): number | null => {
  if (points.length < 2) return null;
  let total = 0;
  let hasValue = false;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    const dtHours = minutesBetween(prev.timestamp, current.timestamp) / 60;
    const avg = average([prev.powerKw, current.powerKw]);
    if (dtHours > 0 && avg != null) {
      total += avg * dtHours;
      hasValue = true;
    }
  }
  return hasValue ? total : null;
};

export const freshWaterShare = (volume: number | null, freshVolume: number | null): number | null => {
  if (volume == null || freshVolume == null || volume <= 0) return null;
  return freshVolume / volume;
};

export const integrateBoolHours = (points: Array<{ timestamp: string; active: boolean | null }>): number | null => {
  if (points.length < 2) return null;
  let total = 0;
  let hasValue = false;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    const dtHours = minutesBetween(prev.timestamp, current.timestamp) / 60;
    if (dtHours > 0 && prev.active === true) {
      total += dtHours;
      hasValue = true;
    }
    if (dtHours > 0 && prev.active === false) {
      hasValue = true;
    }
  }
  return hasValue ? total : null;
};

export const assignGasReactor = (row: DataPoint): ReactorGasAssignment => {
  const assignments = ['R1', 'R2', 'R3', 'R4'].filter((reactor) => normalizeNumeric(row[`V${reactor.slice(1)}_2_V_AER`]) === 1);
  const flow = normalizeNumeric(row.F_Absaugung);
  if (!flow || flow <= 0) return 'unassigned';
  if (assignments.length === 1) return assignments[0] as ReactorId;
  if (assignments.length > 1) return 'ambiguous';
  return 'unassigned';
};

export const findBatchForTimestamp = (batches: Batch[], reactor: ReactorId, timestamp: string): Batch | null => {
  const ts = new Date(timestamp).getTime();
  const candidates = batches.filter((batch) => batch.reactor === reactor && new Date(batch.fill_at).getTime() <= ts);
  const match = candidates.find((batch) => {
    if (!batch.empty_at) return true;
    return ts < new Date(batch.empty_at).getTime();
  });
  return match ?? null;
};

export const batchDurationHours = (batch: Batch, endTimestamp: string): number => {
  const end = batch.empty_at ?? endTimestamp;
  return Math.max(0, hoursSince(batch.fill_at, end));
};

import { hoursSince } from './time';

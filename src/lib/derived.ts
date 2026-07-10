import { hoursSince, minutesBetween } from './time';
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

export const TEMPERATURE_KEYS = new Set([
  'T_VL_global',
  'T_Speicher_oben',
  'T_Speicher_unten',
  'T_FW',
  'T_AER',
  'T_Absaugung',
  'T_Umgebung',
  'T_RL_R1',
  'T_Innenraum_R1',
  'T_oben_L_R1',
  'T_oben_R_R1',
  'T_unter_L_R1',
  'T_unter_R_R1',
  'T_Mittel_R1',
  'T_RL_R2',
  'T_Innenraum_R2',
  'T_oben_L_R2',
  'T_oben_R_R2',
  'T_unter_L_R2',
  'T_unter_R_R2',
  'T_Mittel_R2',
  'T_RL_R3',
  'T_Innenraum_R3',
  'T_oben_L_R3',
  'T_oben_R_R3',
  'T_unter_L_R3',
  'T_unter_R_R3',
  'T_Mittel_R3',
  'T_RL_R4',
  'T_Innenraum_R4',
  'T_oben_L_R4',
  'T_oben_R_R4',
  'T_unter_L_R4',
  'T_unter_R_R4',
  'T_Mittel_R4'
]);

const normalizeTemperatureNumber = (value: unknown): number | null => {
  const numeric = normalizeNumeric(value);
  if (numeric == null) return null;
  return Math.abs(numeric) >= 1000 ? numeric / 100 : numeric;
};

export const formatTemperatureValue = (value: unknown): string => {
  const numeric = normalizeTemperatureNumber(value);
  if (numeric == null) return '–';
  return `${numeric.toFixed(1)} °C`;
};

export const normalizeTemperaturePoint = (value: unknown): number | null => normalizeTemperatureNumber(value);

export const average = (values: Array<number | null | undefined>): number | null => {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

export const biomassAverageTemperature = (row: DataPoint, reactor: ReactorId): number | null => {
  return average([
    normalizeTemperaturePoint(row[`T_oben_L_${reactor}`]),
    normalizeTemperaturePoint(row[`T_oben_R_${reactor}`]),
    normalizeTemperaturePoint(row[`T_unter_L_${reactor}`]),
    normalizeTemperaturePoint(row[`T_unter_R_${reactor}`]),
    normalizeTemperaturePoint(row[`T_Mittel_${reactor}`])
  ]);
};

export const temperatureGradient = (row: DataPoint, reactor: ReactorId): number | null => {
  const top = average([normalizeTemperaturePoint(row[`T_oben_L_${reactor}`]), normalizeTemperaturePoint(row[`T_oben_R_${reactor}`])]);
  const bottom = average([normalizeTemperaturePoint(row[`T_unter_L_${reactor}`]), normalizeTemperaturePoint(row[`T_unter_R_${reactor}`])]);
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

export const isTruthySignal = (value: unknown): boolean => {
  const numeric = normalizeNumeric(value);
  if (numeric != null) return numeric > 0;
  return Boolean(value);
};

export const isActiveValue = (value: unknown): boolean => isTruthySignal(value);

export const formatNumber = (value: unknown, digits = 1): string => {
  const numeric = normalizeNumeric(value);
  if (numeric == null) return '–';
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(digits);
};

export const formatBool = (value: unknown): string => (isTruthySignal(value) ? 'aktiv' : 'inaktiv');

export const boolClass = (value: unknown): string => (isTruthySignal(value) ? 'success' : 'muted');

export const getReactorActuatorState = (row: DataPoint, reactor: ReactorId) => {
  const suffix = reactor.slice(1);
  const pump = isTruthySignal(row.P01_P02_Pn);
  const ventilationCompressor = isTruthySignal(row.C0_1_Komp_AER);
  const exhaustCompressor = isTruthySignal(row.C0_2_Komp_AER);
  const irrigation = isTruthySignal(row[`Q_IRR_${reactor}`]) && pump;
  const heatExtraction = isTruthySignal(row[`V${suffix}_1_V_VL`]) && pump;
  const ventilation = isTruthySignal(row[`V${suffix}_3_V_AER`]) && ventilationCompressor;
  const exhaust = isTruthySignal(row[`V${suffix}_2_V_AER`]) && exhaustCompressor;
  const freshWater = isTruthySignal(row[`V${suffix}_4_V_FW`]) && pump;

  return {
    irrigation,
    heatExtraction,
    ventilation,
    exhaust,
    freshWater,
    pump,
    ventilationCompressor,
    exhaustCompressor
  };
};

export const isReactorActionActive = (row: DataPoint, reactor: ReactorId, action: 'irrigation' | 'heatExtraction' | 'ventilation' | 'exhaust' | 'freshWater') =>
  getReactorActuatorState(row, reactor)[action];

export const getExhaustAnalysisState = (row: DataPoint): { active: boolean; reactor: ReactorId | 'unassigned' | 'ambiguous' } => {
  if (!isTruthySignal(row.C0_2_Komp_AER)) {
    return { active: false, reactor: 'unassigned' };
  }

  const assigned = ['R1', 'R2', 'R3', 'R4'].filter((reactor) => isTruthySignal(row[`V${reactor.slice(1)}_2_V_AER`]));
  if (assigned.length === 1) {
    return { active: true, reactor: assigned[0] as ReactorId };
  }
  if (assigned.length > 1) {
    return { active: true, reactor: 'ambiguous' };
  }
  return { active: true, reactor: 'unassigned' };
};

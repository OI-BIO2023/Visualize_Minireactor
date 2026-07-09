import { REACTORS, type ReactorId } from './reactors';

type FieldSpec = {
  key: string;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  kind?: 'number' | 'boolean';
};

const reactorFields = (suffix: ReactorId) => ({
  temperature: [
    { key: `T_oben_L_${suffix}`, label: 'oben links', unit: '°C', min: -10, max: 100 },
    { key: `T_oben_R_${suffix}`, label: 'oben rechts', unit: '°C', min: -10, max: 100 },
    { key: `T_unter_L_${suffix}`, label: 'unten links', unit: '°C', min: -10, max: 100 },
    { key: `T_unter_R_${suffix}`, label: 'unten rechts', unit: '°C', min: -10, max: 100 },
    { key: `T_Mittel_${suffix}`, label: 'Mitte', unit: '°C', min: -10, max: 100 },
    { key: `T_Innenraum_${suffix}`, label: 'Innenraum', unit: '°C', min: -10, max: 100 }
  ] satisfies FieldSpec[],
  humidity: [
    { key: `HUM_oben_${suffix}`, label: 'oben', unit: '%', min: 0, max: 100 },
    { key: `HUM_unten_${suffix}`, label: 'unten', unit: '%', min: 0, max: 100 }
  ] satisfies FieldSpec[],
  irrigation: [
    { key: `Q_IRR_${suffix}`, label: 'Bewässerung', unit: 'l/min', min: 0, max: 30 },
    { key: `T_IRR_${suffix}`, label: 'Bewässerungstemp.', unit: '°C', min: 0, max: 90 },
    { key: `Vol_watering_${suffix}`, label: 'Volumen', unit: 'l', min: 0, max: 100000 },
    { key: `Vol_watering_${suffix}_fw`, label: 'Frischwasser', unit: 'l', min: 0, max: 100000 }
  ] satisfies FieldSpec[],
  heatExtraction: [
    { key: `T_RL_${suffix}`, label: 'Rücklauf', unit: '°C', min: -10, max: 90 },
    { key: `T_VL_${suffix}`, label: 'Vorlauf', unit: '°C', min: -10, max: 90 },
    { key: `Q_VL_${suffix}`, label: 'Durchfluss', unit: 'l/min', min: 0, max: 100 }
  ] satisfies FieldSpec[],
  valves: [
    { key: `P${suffix.slice(1)}_1_P_IRR`, label: 'Bewässerungspumpe', kind: 'boolean' },
    { key: `V${suffix.slice(1)}_1_V_VL`, label: 'Wärmeentzug', kind: 'boolean' },
    { key: `V${suffix.slice(1)}_3_V_AER`, label: 'Belüftung', kind: 'boolean' },
    { key: `V${suffix.slice(1)}_4_V_FW`, label: 'Frischwasser', kind: 'boolean' },
    { key: `V${suffix.slice(1)}_2_V_AER`, label: 'Abluft', kind: 'boolean' }
  ] satisfies FieldSpec[]
});

export const REACTOR_TAGS = Object.fromEntries(REACTORS.map((reactor) => [reactor, reactorFields(reactor)])) as Record<
  ReactorId,
  ReturnType<typeof reactorFields>
>;

export const GLOBAL_TAGS: FieldSpec[] = [
  { key: 'T_Speicher_oben', label: 'Speicher oben', unit: '°C', min: -10, max: 100 },
  { key: 'T_Speicher_unten', label: 'Speicher unten', unit: '°C', min: -10, max: 100 },
  { key: 'T_VL_global', label: 'Globaler Vorlauf', unit: '°C', min: -10, max: 100 },
  { key: 'T_FW', label: 'Frischwasser', unit: '°C', min: -10, max: 90 },
  { key: 'T_AER', label: 'Belüftungsluft', unit: '°C', min: -10, max: 90 },
  { key: 'T_Absaugung', label: 'Absaugung', unit: '°C', min: -10, max: 90 },
  { key: 'T_Umgebung', label: 'Umgebung', unit: '°C', min: -30, max: 60 },
  { key: 'C0_1_Komp_AER', label: 'Kompressor Belüftung', kind: 'boolean' },
  { key: 'C0_2_Komp_AER', label: 'Kompressor Abluft', kind: 'boolean' },
  { key: 'P01_P02_Pn', label: 'Pumpe', kind: 'boolean' },
  { key: 'Mischventil_V01', label: 'Mischventil', kind: 'boolean' }
];
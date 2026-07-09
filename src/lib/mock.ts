import { REACTORS, type ReactorId } from '../config/reactors';
import { biomassAverageTemperature, heatExtractionPowerKw, type Batch } from './derived';

export const demoTimestamp = new Date('2026-07-09T10:00:00+02:00').toISOString();

const reactorValue = (reactor: ReactorId, offset: number) => {
  const base = REACTORS.indexOf(reactor) + 1 + offset;
  return {
    [`T_oben_L_${reactor}`]: 58 + base,
    [`T_oben_R_${reactor}`]: 57 + base,
    [`T_unter_L_${reactor}`]: 49 + base,
    [`T_unter_R_${reactor}`]: 48 + base,
    [`T_Mittel_${reactor}`]: 53 + base,
    [`T_Innenraum_${reactor}`]: 41 + base / 2,
    [`HUM_oben_${reactor}`]: 68 - base,
    [`HUM_unten_${reactor}`]: 63 - base,
    [`Q_IRR_${reactor}`]: base % 2 === 0 ? 1.2 : 0,
    [`T_IRR_${reactor}`]: 19 + base / 4,
    [`Vol_watering_${reactor}`]: 140 + base * 6,
    [`Vol_watering_${reactor}_fw`]: 55 + base * 2,
    [`T_RL_${reactor}`]: 33 + base / 10,
    [`T_VL_${reactor}`]: 29 + base / 10,
    [`Q_VL_${reactor}`]: 3.4 + base / 10,
    [`P${reactor.slice(1)}_1_P_IRR`]: base % 2 === 0 ? 1 : 0,
    [`V${reactor.slice(1)}_1_V_VL`]: 1,
    [`V${reactor.slice(1)}_3_V_AER`]: 1,
    [`V${reactor.slice(1)}_4_V_FW`]: base % 3 === 0 ? 1 : 0,
    [`V${reactor.slice(1)}_2_V_AER`]: reactor === 'R2' ? 1 : 0
  };
};

export const demoLatest = {
  timestamp: demoTimestamp,
  T_Speicher_oben: 61.2,
  T_Speicher_unten: 52.8,
  T_VL_global: 34.5,
  T_FW: 17.6,
  T_AER: 26.2,
  T_Absaugung: 28.1,
  T_Umgebung: 22.4,
  CO_Sonde: 113,
  CO2_Sonde: 2120,
  O2_Sonde: 18.9,
  F_Absaugung: 64,
  CH4_Sonde: 42,
  C0_1_Komp_AER: 1,
  C0_2_Komp_AER: 0,
  P01_P02_Pn: 1,
  Mischventil_V01: 54,
  ...reactorValue('R1', 0),
  ...reactorValue('R2', 1),
  ...reactorValue('R3', 2),
  ...reactorValue('R4', 3)
};

export const demoBatches: Batch[] = [
  {
    batch_id: 'MI-R1-2026-07-01',
    reactor: 'R1',
    fill_at: '2026-07-01T08:00:00+02:00',
    empty_at: '2026-08-15T10:00:00+02:00',
    biomass: { fresh_mass_kg: 125.4, dry_matter_percent: 32.5 }
  },
  {
    batch_id: 'MI-R2-2026-07-02',
    reactor: 'R2',
    fill_at: '2026-07-02T08:00:00+02:00',
    empty_at: '2026-08-16T10:00:00+02:00',
    biomass: { fresh_mass_kg: 127.8, dry_matter_percent: 31.8 }
  },
  {
    batch_id: 'MI-R3-2026-07-03',
    reactor: 'R3',
    fill_at: '2026-07-03T08:00:00+02:00',
    empty_at: '2026-08-17T10:00:00+02:00',
    biomass: { fresh_mass_kg: 124.1, dry_matter_percent: 33.1 }
  },
  {
    batch_id: 'MI-R4-2026-07-04',
    reactor: 'R4',
    fill_at: '2026-07-04T08:00:00+02:00',
    empty_at: null,
    biomass: { fresh_mass_kg: 128.6, dry_matter_percent: 32 }
  }
];

export const demoHistorySeries = (reactor: ReactorId) =>
  Array.from({ length: 48 }, (_, index) => {
    const timestamp = new Date(Date.parse(demoTimestamp) - (47 - index) * 60 * 60 * 1000).toISOString();
    const temp = biomassAverageTemperature(
      {
        [`T_oben_L_${reactor}`]: 50 + index / 4,
        [`T_oben_R_${reactor}`]: 49 + index / 4,
        [`T_unter_L_${reactor}`]: 44 + index / 6,
        [`T_unter_R_${reactor}`]: 43 + index / 6,
        [`T_Mittel_${reactor}`]: 47 + index / 5
      },
      reactor
    );
    return {
      timestamp,
      [`T_Mittel_${reactor}`]: temp,
      [`T_oben_L_${reactor}`]: 50 + index / 4,
      [`T_oben_R_${reactor}`]: 49 + index / 4,
      [`T_unter_L_${reactor}`]: 44 + index / 6,
      [`T_unter_R_${reactor}`]: 43 + index / 6,
      [`HUM_oben_${reactor}`]: 72 - index / 8,
      [`HUM_unten_${reactor}`]: 67 - index / 10,
      [`Q_VL_${reactor}`]: 3 + index / 30,
      [`T_RL_${reactor}`]: 33 + index / 20,
      [`T_VL_${reactor}`]: 29 + index / 20,
      [`Q_IRR_${reactor}`]: index % 8 < 2 ? 1.1 : 0,
      [`Vol_watering_${reactor}`]: 100 + index * 2,
      [`Vol_watering_${reactor}_fw`]: 40 + index,
      [`V${reactor.slice(1)}_1_V_VL`]: index % 3 ? 1 : 0,
      [`V${reactor.slice(1)}_3_V_AER`]: 1,
      [`V${reactor.slice(1)}_2_V_AER`]: reactor === 'R2' ? 1 : 0,
      F_Absaugung: reactor === 'R2' ? 60 : 0
    };
  });

export const demoHeatExtractionKw = (reactor: ReactorId) =>
  demoHistorySeries(reactor).map((row) => ({
    timestamp: row.timestamp,
    powerKw: heatExtractionPowerKw(row[`Q_VL_${reactor}`] as number, row[`T_RL_${reactor}`] as number, row[`T_VL_${reactor}`] as number)
  }));

import type { ReactorId } from './reactors';

export type BiomassMixItem = {
  label: string;
  sharePercent: number;
};

export type ExperimentSeries = {
  id: string;
  title: string;
  description: string;
  start: string;
  plannedEnd: string;
  reactors: ReactorId[];
  biomass: {
    summary: string;
    mix: BiomassMixItem[];
  };
};

export const EXPERIMENT_SERIES: ExperimentSeries[] = [
  {
    id: 'MI-2026-SUMMER',
    title: 'MiniReactor Sommer 2026',
    description: 'Hauptversuchsreihe für den laufenden Demonstratorbetrieb.',
    start: '2026-07-01T08:00:00+02:00',
    plannedEnd: '2026-09-29T10:00:00+02:00',
    reactors: ['R1', 'R2', 'R3', 'R4'],
    biomass: {
      summary: '50 % Apfel, 50 % Traube',
      mix: [
        { label: 'Apfel', sharePercent: 50 },
        { label: 'Traube', sharePercent: 50 }
      ]
    }
  }
];

export const DEFAULT_EXPERIMENT_ID = EXPERIMENT_SERIES[0]?.id ?? 'MI-2026-SUMMER';

export const getExperimentSeries = (id: string) => EXPERIMENT_SERIES.find((experiment) => experiment.id === id) ?? EXPERIMENT_SERIES[0];

export const resolveExperimentRange = (experiment: ExperimentSeries, now = new Date()) => {
  const start = new Date(experiment.start);
  const plannedEnd = new Date(experiment.plannedEnd);
  const end = plannedEnd.getTime() > now.getTime() ? now : plannedEnd;

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
};

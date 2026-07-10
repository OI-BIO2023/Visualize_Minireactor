import type { ExperimentSeries } from '../config/experiments';

type Props = {
  experiments: ExperimentSeries[];
  selectedExperimentId: string;
  onSelectExperiment: (id: string) => void;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

export function PeriodSelector({ experiments, selectedExperimentId, onSelectExperiment }: Props) {
  const selected = experiments.find((experiment) => experiment.id === selectedExperimentId) ?? experiments[0];

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Versuchsreihe wählen</h2>
        </div>
      </div>
      <div className="selector-grid selector-grid-wide">
        <label>
          Versuchsreihe
          <select value={selectedExperimentId} onChange={(event) => onSelectExperiment(event.target.value)}>
            {experiments.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.title}
              </option>
            ))}
          </select>
        </label>
        {selected ? (
          <div className="subpanel experiment-meta">
            <h3>Metadaten</h3>
            <p>
              Zeitraum: <strong>{formatDateTime(selected.start)}</strong> bis <strong>{formatDateTime(selected.plannedEnd)}</strong>
            </p>
            <p>
              Biomasse: <strong>{selected.biomass.summary}</strong>
            </p>
            <p className="muted">
              Reaktoren: <strong>{selected.reactors.join(', ')}</strong>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

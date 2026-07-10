import { GLOBAL_TEMPERATURE_TAGS } from '../config/tags';
import { normalizeTemperaturePoint } from '../lib/derived';
import { TimeSeriesChart } from './TimeSeriesChart';

type Props = {
  series: Record<string, unknown>[];
};

const colors = ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa', '#0ea5e9', '#f97316', '#06b6d4'];

export function GlobalHistoryPanel({ series }: Props) {
  const datasets = GLOBAL_TEMPERATURE_TAGS.map((tag, index) => ({
    label: tag.label,
    data: series.map((row) => ({
      x: row.timestamp as string,
      y: normalizeTemperaturePoint(row[tag.key])
    })),
    borderColor: colors[index % colors.length],
    borderWidth: tag.key === 'T_Umgebung' ? 2 : 1,
    pointRadius: 0,
    tension: 0.18
  }));

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Globale Zeitreihen</h2>
          <p className="muted">Temperaturen der Gesamtanlage, getrennt von den Reaktoren.</p>
        </div>
      </div>
      <TimeSeriesChart compact title="Globale Temperaturen" data={{ datasets }} />
    </section>
  );
}
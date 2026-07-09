import { GLOBAL_TAGS } from '../config/tags';
import type { QualityFlag } from '../lib/quality';
import { formatBool } from '../lib/derived';
import { QualityBadge } from './QualityBadge';

type Props = {
  data: Record<string, unknown> | null;
  lastTimestamp: string | null;
  flags: QualityFlag[];
};

const formatValue = (value: unknown) => {
  if (value == null) return '–';
  if (typeof value === 'boolean') return formatBool(value);
  if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return String(value);
};

export function GlobalOverview({ data, lastTimestamp, flags }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Globale Anlagenübersicht</h2>
          <p className="muted">Kompakte Kennzahlen für die gesamte Anlage.</p>
          <p className="muted">Letzter Datenpunkt: {lastTimestamp ?? 'kein gültiger Wert'}</p>
        </div>
        <div className="chip-row">
          {flags.length ? <span className="status-badge warning">Datenqualität beachten</span> : <span className="status-badge success">Daten sauber</span>}
        </div>
      </div>
      {flags.length ? (
        <div className="chip-row">
          {flags.map((flag) => (
            <QualityBadge key={flag} flag={flag} />
          ))}
        </div>
      ) : null}
      <div className="metric-grid metric-grid-wide">
        {GLOBAL_TAGS.map((tag) => (
          <article className="metric-card" key={tag.key}>
            <span className="metric-label">{tag.label}</span>
            <div className="metric-inline">
              <strong>{formatValue(data?.[tag.key])}</strong>
              {tag.unit ? <span className="metric-unit">{tag.unit}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
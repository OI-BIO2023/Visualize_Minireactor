import type { QualityFlag } from '../lib/quality';
import { QualityBadge } from './QualityBadge';
import { formatDateTime } from '../lib/time';

type Props = {
  data: Record<string, unknown> | null;
  timestamp: string | null;
  flags: QualityFlag[];
  processState: {
    active: boolean;
    reactor: string;
  };
};

export function GasPanel({ data, timestamp, flags, processState }: Props) {
  const items = ['CO_Sonde', 'CO2_Sonde', 'O2_Sonde', 'CH4_Sonde', 'F_Absaugung'] as const;
  const renderValue = (value: unknown) => {
    if (value == null) return '–';
    if (typeof value === 'number') return value.toFixed(1);
    if (typeof value === 'boolean') return value ? '1' : '0';
    return String(value);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Gas-Panel</h2>
          <p className="muted">Letzter Datenpunkt: {formatDateTime(timestamp)}</p>
        </div>
        <div className="chip-row">
          <span className={`status-badge ${processState.active ? 'success' : 'warning'}`}>Prozess {processState.active ? 'aktiv' : 'inaktiv'}</span>
          <span className="status-badge">Analyse für: {processState.active ? processState.reactor : 'kein aktiver Reaktor'}</span>
        </div>
      </div>
      <div className="metric-grid gas-metric-grid">
        {items.map((key) => (
          <article key={key} className="metric-card metric-card-gas">
            <span className="metric-label">{key.replace('_Sonde', '')}</span>
            <strong>{renderValue(data?.[key])}</strong>
          </article>
        ))}
      </div>
      {flags.length ? (
        <div className="chip-row">
          {flags.map((flag) => (
            <QualityBadge key={flag} flag={flag} />
          ))}
        </div>
      ) : null}
      {flags.length ? <p className="hint">Hinweis: {flags.join(', ')}</p> : null}
    </section>
  );
}
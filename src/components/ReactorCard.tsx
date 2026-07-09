import { REACTOR_TAGS } from '../config/tags';
import type { ReactorId } from '../config/reactors';
import { ReactorSchematic } from './ReactorSchematic';
import type { QualityFlag } from '../lib/quality';

type Props = {
  reactor: ReactorId;
  data: Record<string, unknown> | null;
  flags: QualityFlag[];
  activeGas: string;
};

const value = (entry: unknown) => (typeof entry === 'number' ? entry.toFixed(entry < 10 ? 2 : 1) : entry == null ? 'â€“' : String(entry));

export function ReactorCard({ reactor, data, flags, activeGas }: Props) {
  const tags = REACTOR_TAGS[reactor];
  return (
    <article className="panel reactor-card">
      <div className="panel-header">
        <div>
          <h2>{reactor}</h2>
          <p className="muted">Gaszuordnung: {activeGas}</p>
        </div>
        <div className="badge-stack">
          <span className="status-badge">{flags.length ? `${flags.length} Hinweis(e)` : 'ok'}</span>
        </div>
      </div>
      <ReactorSchematic reactor={reactor} />
      <div className="temp-matrix">
        {tags.temperature.slice(0, 5).map((tag) => (
          <div key={tag.key} className="mini-metric">
            <span>{tag.label}</span>
            <strong>{value(data?.[tag.key])}</strong>
            <small>{tag.unit}</small>
          </div>
        ))}
      </div>
      <div className="subgrid">
        <div className="subpanel">
          <h3>Innenraum & Feuchte</h3>
          <p>Innenraum: <strong>{value(data?.[`T_Innenraum_${reactor}`])} Â°C</strong></p>
          <p>Feuchte oben/unten: <strong>{value(data?.[`HUM_oben_${reactor}`])} / {value(data?.[`HUM_unten_${reactor}`])} %</strong></p>
        </div>
        <div className="subpanel">
          <h3>WÃ¤rmeentzug</h3>
          <p>VL/RL: <strong>{value(data?.[`T_VL_${reactor}`])} / {value(data?.[`T_RL_${reactor}`])} Â°C</strong></p>
          <p>Durchfluss: <strong>{value(data?.[`Q_VL_${reactor}`])} l/min</strong></p>
        </div>
        <div className="subpanel">
          <h3>BewÃ¤sserung</h3>
          <p>Q_IRR: <strong>{value(data?.[`Q_IRR_${reactor}`])} l/min</strong></p>
          <p>Volumen: <strong>{value(data?.[`Vol_watering_${reactor}`])} l</strong></p>
        </div>
        <div className="subpanel">
          <h3>Status</h3>
          <div className="chip-row">
            <span className={`status-badge ${Number(data?.[`Q_IRR_${reactor}`] ?? 0) > 0 ? 'success' : ''}`}>BewÃ¤sserung</span>
            <span className={`status-badge ${(Number(data?.[`V${reactor.slice(1)}_1_V_VL`]) ?? 0) > 0 ? 'success' : 'muted'}`}>WÃ¤rmeentzug</span>
            <span className={`status-badge ${(Number(data?.[`V${reactor.slice(1)}_3_V_AER`]) ?? 0) > 0 ? 'success' : 'muted'}`}>BelÃ¼ftung</span>
            <span className={`status-badge ${(Number(data?.[`V${reactor.slice(1)}_4_V_FW`]) ?? 0) > 0 ? 'success' : 'muted'}`}>Frischwasser</span>
            <span className={`status-badge ${(Number(data?.[`V${reactor.slice(1)}_2_V_AER`]) ?? 0) > 0 ? 'success' : 'muted'}`}>Abluft</span>
          </div>
        </div>
      </div>
    </article>
  );
}

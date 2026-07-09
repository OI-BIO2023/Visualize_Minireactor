import { REACTOR_TAGS } from '../config/tags';
import type { ReactorId } from '../config/reactors';
import { ReactorSchematic } from './ReactorSchematic';
import type { QualityFlag } from '../lib/quality';
import { getReactorActuatorState, formatBool } from '../lib/derived';

type Props = {
  reactor: ReactorId;
  data: Record<string, unknown> | null;
  flags: QualityFlag[];
  activeGas: string;
};

const value = (entry: unknown) => (typeof entry === 'number' ? entry.toFixed(entry < 10 ? 2 : 1) : entry == null ? '–' : String(entry));

export function ReactorCard({ reactor, data, flags, activeGas }: Props) {
  const tags = REACTOR_TAGS[reactor];
  const state = data ? getReactorActuatorState(data, reactor) : null;
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
      <ReactorSchematic reactor={reactor} values={data} />
      <div className="temp-matrix">
        {tags.temperature.slice(0, 5).map((tag) => (
          <div key={tag.key} className="mini-metric">
            <span>{tag.label}</span>
            <strong>
              {value(data?.[tag.key])}
              {tag.unit ? <span className="metric-unit metric-unit-inline">{tag.unit}</span> : null}
            </strong>
          </div>
        ))}
      </div>
      <div className="subgrid">
        <div className="subpanel">
          <h3>Innenraum & Feuchte</h3>
          <p>
            Innenraum: <strong>{value(data?.[`T_Innenraum_${reactor}`])}°C</strong>
          </p>
          <p>
            Feuchte oben/unten: <strong>{value(data?.[`HUM_oben_${reactor}`])} / {value(data?.[`HUM_unten_${reactor}`])} %</strong>
          </p>
        </div>
        <div className="subpanel">
          <h3>Wärmeentzug</h3>
          <p>
            VL/RL: <strong>{value(data?.[`T_VL_${reactor}`])} / {value(data?.[`T_RL_${reactor}`])} °C</strong>
          </p>
          <p>
            Durchfluss: <strong>{value(data?.[`Q_VL_${reactor}`])} l/min</strong>
          </p>
        </div>
        <div className="subpanel">
          <h3>Bewässerung</h3>
          <p>
            Q_IRR: <strong>{value(data?.[`Q_IRR_${reactor}`])} l/min</strong>
          </p>
          <p>
            Volumen: <strong>{value(data?.[`Vol_watering_${reactor}`])} l</strong>
          </p>
        </div>
        <div className="subpanel">
          <h3>Status</h3>
          <div className="chip-row">
            <span className={`status-badge ${state?.irrigation ? 'success' : ''}`}>Bewässerung {state ? formatBool(state.irrigation) : 'inaktiv'}</span>
            <span className={`status-badge ${state?.heatExtraction ? 'success' : ''}`}>Wärmeentzug {state ? formatBool(state.heatExtraction) : 'inaktiv'}</span>
            <span className={`status-badge ${state?.ventilation ? 'success' : ''}`}>Belüftung {state ? formatBool(state.ventilation) : 'inaktiv'}</span>
            <span className={`status-badge ${state?.freshWater ? 'success' : ''}`}>Frischwasser {state ? formatBool(state.freshWater) : 'inaktiv'}</span>
            <span className={`status-badge ${state?.exhaust ? 'success' : ''}`}>Abluft {state ? formatBool(state.exhaust) : 'inaktiv'}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
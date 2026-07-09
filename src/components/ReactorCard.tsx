import type { ReactorId } from '../config/reactors';
import { ReactorSchematic } from './ReactorSchematic';
import type { QualityFlag } from '../lib/quality';
import { formatBool, getReactorActuatorState } from '../lib/derived';

type Props = {
  reactor: ReactorId;
  data: Record<string, unknown> | null;
  flags: QualityFlag[];
};

const value = (entry: unknown) => (typeof entry === 'number' ? entry.toFixed(entry < 10 ? 2 : 1) : entry == null ? '–' : String(entry));

export function ReactorCard({ reactor, data, flags }: Props) {
  const state = data ? getReactorActuatorState(data, reactor) : null;
  return (
    <article className="panel reactor-card">
      <div className="panel-header">
        <div>
          <h2>{reactor}</h2>
          <p className="muted">Reaktorspezifische Schaubilder und Aktorikstatus.</p>
        </div>
        <div className="badge-stack">
          <span className="status-badge">{flags.length ? `${flags.length} Hinweis(e)` : 'ok'}</span>
        </div>
      </div>
      <ReactorSchematic reactor={reactor} values={data} />
      <div className="subgrid reactor-subgrid">
        <div className="subpanel">
          <h3>Feuchte</h3>
          <p>
            Oben/unten: <strong>{value(data?.[`HUM_oben_${reactor}`])} / {value(data?.[`HUM_unten_${reactor}`])} %</strong>
          </p>
        </div>
        <div className="subpanel">
          <h3>Wärmeentzug</h3>
          <p>
            Durchfluss: <strong>{value(data?.[`Q_VL_${reactor}`])} l/min</strong>
          </p>
          <p>
            Zustand: <strong>{state ? formatBool(state.heatExtraction) : 'inaktiv'}</strong>
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
import { useEffect, useMemo, useState } from 'react';
import { getBatches, getData } from '../lib/api';
import { demoBatches, demoHistorySeries } from '../lib/mock';
import {
  batchDurationHours,
  assignGasReactor,
  biomassAverageTemperature,
  freshWaterShare,
  heatExtractionPowerKw,
  integrateBoolHours,
  integrateEnergyKwh,
  type Batch
} from '../lib/derived';
import { PeriodSelector } from './PeriodSelector';
import { TimeSeriesChart } from './TimeSeriesChart';
import { REACTORS } from '../config/reactors';
import { formatDateTime } from '../lib/time';

const defaultBatch = demoBatches[0];

export function HistoryDashboard() {
  const [batches, setBatches] = useState<Batch[]>(demoBatches);
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatch.batch_id);
  const [manualRange, setManualRange] = useState({
    start: defaultBatch.fill_at,
    end: defaultBatch.empty_at ?? new Date().toISOString()
  });
  const [series, setSeries] = useState<Record<string, unknown>[]>([]);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.batch_id === selectedBatchId) ?? batches[0],
    [batches, selectedBatchId]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await getBatches();
        if (!cancelled && payload.ok) {
          setBatches(payload.batches);
          setSelectedBatchId((current) => (payload.batches.some((batch) => batch.batch_id === current) ? current : payload.batches[0]?.batch_id ?? current));
        }
      } catch {
        // keep demo batches
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const start = manualRange.start || selectedBatch.fill_at;
      const end = manualRange.end || selectedBatch.empty_at || new Date().toISOString();
      try {
        const payload = await getData({ start, end, ident: 'MI', type: 'value' });
        if (!cancelled && payload.ok) setSeries(payload.items);
      } catch {
        if (!cancelled) setSeries(demoHistorySeries(selectedBatch.reactor));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manualRange, selectedBatch]);

  const batch = selectedBatch ?? defaultBatch;
  const reactor = batch.reactor;
  const chartSeries = series.length ? series : demoHistorySeries(reactor);
  const lastRow = chartSeries.at(-1) as Record<string, unknown> | undefined;
  const temperaturePoints = chartSeries.map((row) => ({
    x: row.timestamp as string,
    y: biomassAverageTemperature(row, reactor)
  }));
  const powerPoints = chartSeries.map((row) => ({
    x: row.timestamp as string,
    y: heatExtractionPowerKw(Number(row[`Q_VL_${reactor}`] ?? 0), Number(row[`T_RL_${reactor}`] ?? 0), Number(row[`T_VL_${reactor}`] ?? 0))
  }));
  const humidityPoints = chartSeries.map((row) => ({
    x: row.timestamp as string,
    y: Number(row[`HUM_oben_${reactor}`] ?? 0)
  }));
  const gasAssignmentPoints = chartSeries.map((row) => ({
    x: row.timestamp as string,
    y: assignGasReactor(row) === reactor ? 1 : 0
  }));

  const temperatureValues = chartSeries.map((row) => biomassAverageTemperature(row, reactor)).filter((value): value is number => value != null);
  const metrics = {
    durationHours: batchDurationHours(batch, manualRange.end),
    maxTemperature: temperatureValues.length ? Math.max(...temperatureValues) : null,
    meanTemperature: temperatureValues.length ? temperatureValues.reduce((sum, value) => sum + value, 0) / temperatureValues.length : null,
    gradient:
      chartSeries.reduce(
        (sum, row) => sum + (Number(row[`T_oben_L_${reactor}`] ?? 0) + Number(row[`T_oben_R_${reactor}`] ?? 0) - Number(row[`T_unter_L_${reactor}`] ?? 0) - Number(row[`T_unter_R_${reactor}`] ?? 0)) / 2,
        0
      ) / Math.max(1, chartSeries.length),
    waterShare: freshWaterShare(lastRow?.[`Vol_watering_${reactor}`] as number | null, lastRow?.[`Vol_watering_${reactor}_fw`] as number | null),
    irrigationHours: integrateBoolHours(
      chartSeries.map((row) => ({
        timestamp: row.timestamp as string,
        active: Number(row[`Q_IRR_${reactor}`] ?? 0) > 0
      }))
    ),
    heatHours: integrateBoolHours(
      chartSeries.map((row) => ({
        timestamp: row.timestamp as string,
        active: Number(row[`V${reactor.slice(1)}_1_V_VL`] ?? 0) > 0
      }))
    ),
    heatEnergy: integrateEnergyKwh(
      chartSeries.map((row) => ({
        timestamp: row.timestamp as string,
        powerKw: heatExtractionPowerKw(Number(row[`Q_VL_${reactor}`] ?? 0), Number(row[`T_RL_${reactor}`] ?? 0), Number(row[`T_VL_${reactor}`] ?? 0))
      }))
    )
  };

  return (
    <main className="page">
      <header className="hero">
        <div>
          <h1>Historie</h1>
          <p className="muted">
            Batch {batch.batch_id} fÃ¼r {reactor}
          </p>
        </div>
        <a href="/" className="back-link">
          Zur Live-Ansicht
        </a>
      </header>
      <PeriodSelector batches={batches} selectedBatchId={selectedBatchId} onChange={setSelectedBatchId} onManualRangeChange={setManualRange} manualRange={manualRange} />
      <section className="panel">
        <h2>Kennzahlen</h2>
        <div className="metric-grid metric-grid-wide">
          <article className="metric-card">
            <span className="metric-label">Dauer</span>
            <strong>{metrics.durationHours.toFixed(1)}</strong>
            <span className="metric-unit">h</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Max</span>
            <strong>{metrics.maxTemperature == null ? 'â€“' : metrics.maxTemperature.toFixed(1)}</strong>
            <span className="metric-unit">Â°C</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Mittel</span>
            <strong>{metrics.meanTemperature == null ? 'â€“' : metrics.meanTemperature.toFixed(1)}</strong>
            <span className="metric-unit">Â°C</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Gradient</span>
            <strong>{Number.isFinite(metrics.gradient) ? metrics.gradient.toFixed(1) : 'â€“'}</strong>
            <span className="metric-unit">Â°C</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Frischwasseranteil</span>
            <strong>{metrics.waterShare == null ? 'â€“' : (metrics.waterShare * 100).toFixed(1)}</strong>
            <span className="metric-unit">%</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">BewÃ¤sserung</span>
            <strong>{metrics.irrigationHours?.toFixed(1) ?? 'â€“'}</strong>
            <span className="metric-unit">h</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">WÃ¤rmeentzug</span>
            <strong>{metrics.heatHours?.toFixed(1) ?? 'â€“'}</strong>
            <span className="metric-unit">h</span>
          </article>
          <article className="metric-card">
            <span className="metric-label">Energie</span>
            <strong>{metrics.heatEnergy == null ? 'â€“' : metrics.heatEnergy.toFixed(2)}</strong>
            <span className="metric-unit">kWh</span>
          </article>
        </div>
      </section>
      <div className="chart-stack">
        <TimeSeriesChart
          title={`Biomasse-Temperatur ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Mittel',
                data: temperaturePoints,
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34,197,94,0.2)'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`Feuchtigkeit ${reactor}`}
          data={{
            datasets: [
              {
                label: 'oben',
                data: humidityPoints,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56,189,248,0.15)'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`WÃ¤rmeentzug ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Leistung',
                data: powerPoints,
                borderColor: '#f59e0b'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`BewÃ¤sserung ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Q_IRR',
                data: chartSeries.map((row) => ({
                  x: row.timestamp as string,
                  y: Number(row[`Q_IRR_${reactor}`] ?? 0)
                })),
                borderColor: '#22c55e',
                stepped: true
              },
              {
                label: 'Frischwasseranteil',
                data: chartSeries.map((row) => {
                  const volume = Number(row[`Vol_watering_${reactor}`] ?? 0);
                  const fresh = Number(row[`Vol_watering_${reactor}_fw`] ?? 0);
                  return {
                    x: row.timestamp as string,
                    y: volume > 0 ? fresh / volume : null
                  };
                }),
                borderColor: '#38bdf8'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`Aktoren ${reactor}`}
          data={{
            datasets: [
              {
                label: 'WÃ¤rmeentzug',
                data: chartSeries.map((row) => ({
                  x: row.timestamp as string,
                  y: Number(row[`V${reactor.slice(1)}_1_V_VL`] ?? 0)
                })),
                stepped: true,
                borderColor: '#f59e0b'
              },
              {
                label: 'BelÃ¼ftung',
                data: chartSeries.map((row) => ({
                  x: row.timestamp as string,
                  y: Number(row[`V${reactor.slice(1)}_3_V_AER`] ?? 0)
                })),
                stepped: true,
                borderColor: '#a78bfa'
              },
              {
                label: 'Abluft',
                data: chartSeries.map((row) => ({
                  x: row.timestamp as string,
                  y: Number(row[`V${reactor.slice(1)}_2_V_AER`] ?? 0)
                })),
                stepped: true,
                borderColor: '#ef4444'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`Gaswerte ${reactor}`}
          data={{
            datasets: [
              {
                label: 'CO',
                data: chartSeries.map((row) => ({ x: row.timestamp as string, y: Number(row.CO_Sonde ?? 0) })),
                borderColor: '#ef4444'
              },
              {
                label: 'CO2',
                data: chartSeries.map((row) => ({ x: row.timestamp as string, y: Number(row.CO2_Sonde ?? 0) })),
                borderColor: '#a78bfa'
              },
              {
                label: 'O2',
                data: chartSeries.map((row) => ({ x: row.timestamp as string, y: Number(row.O2_Sonde ?? 0) })),
                borderColor: '#38bdf8'
              },
              {
                label: 'CH4',
                data: chartSeries.map((row) => ({ x: row.timestamp as string, y: Number(row.CH4_Sonde ?? 0) })),
                borderColor: '#f59e0b'
              },
              {
                label: 'F_Absaugung',
                data: chartSeries.map((row) => ({ x: row.timestamp as string, y: Number(row.F_Absaugung ?? 0) })),
                borderColor: '#22c55e'
              }
            ]
          }}
        />
        <TimeSeriesChart
          title={`Gaszuordnung ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Zuordnung',
                data: gasAssignmentPoints,
                borderColor: '#22c55e',
                stepped: true
              }
            ]
          }}
        />
      </div>
      <section className="panel">
        <h2>Reaktorvergleich</h2>
        <div className="chip-row">
          {REACTORS.map((r) => (
            <span key={r} className={`status-badge ${r === reactor ? 'success' : ''}`}>
              {r}
            </span>
          ))}
        </div>
        <p className="muted">Die Auswertung ist um Batch-Zeitfenster herum aufgebaut und kann fÃ¼r spÃ¤tere ML-Exporte direkt wiederverwendet werden.</p>
      </section>
      <section className="panel">
        <h2>Zeitraum</h2>
        <p className="muted">
          {formatDateTime(batch.fill_at)} bis {formatDateTime(batch.empty_at ?? manualRange.end)}
        </p>
      </section>
    </main>
  );
}

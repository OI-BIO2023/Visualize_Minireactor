import type { ChartOptions } from 'chart.js';
import { REACTOR_TAGS } from '../config/tags';
import type { ReactorId } from '../config/reactors';
import {
  average,
  biomassAverageTemperature,
  heatExtractionPowerKw,
  isTruthySignal,
  normalizeTemperaturePoint
} from '../lib/derived';
import { normalizeNumeric } from '../lib/quality';
import { formatDateTime } from '../lib/time';
import { TimeSeriesChart } from './TimeSeriesChart';

type Props = {
  reactor: ReactorId;
  series: Record<string, unknown>[];
};

const sensorColors = ['#7dd3fc', '#38bdf8', '#22c55e', '#86efac', '#f59e0b', '#a78bfa', '#94a3b8', '#c084fc'];
const humidityColors = ['#38bdf8', '#0ea5e9'];
const actionColors = {
  irrigation: '#22c55e',
  heatExtraction: '#f59e0b',
  ventilation: '#38bdf8',
  exhaust: '#ef4444',
  freshWater: '#a78bfa'
};

const makePoints = (series: Record<string, unknown>[], key: string) =>
  series.map((row) => ({
    x: row.timestamp as string,
    y: key.startsWith('T_') ? normalizeTemperaturePoint(row[key]) : normalizeNumeric(row[key])
  }));

const makeBinaryPoints = (series: Record<string, unknown>[], key: string) => series.map((row) => ({ x: row.timestamp as string, y: isTruthySignal(row[key]) ? 1 : 0 }));
const formatSeriesLabel = (label: string) => label.replaceAll('_', ' ');

export function ReactorHistoryPanel({ reactor, series }: Props) {
  const tags = REACTOR_TAGS[reactor];
  const last = series.at(-1);
  const temperatureAverage = series.map((row) => ({
    x: row.timestamp as string,
    y: biomassAverageTemperature(row, reactor)
  }));
  const humidityAverage = series.map((row) => {
    const upper = normalizeNumeric(row[`HUM_oben_${reactor}`]);
    const lower = normalizeNumeric(row[`HUM_unten_${reactor}`]);
    return { x: row.timestamp as string, y: average([upper, lower]) };
  });
  const irrigationTemperature = series.map((row) => ({
    x: row.timestamp as string,
    y: normalizeTemperaturePoint(row[`T_IRR_${reactor}`])
  }));
  const irrigationFlow = series.map((row) => ({
    x: row.timestamp as string,
    y: normalizeNumeric(row[`Q_IRR_${reactor}`])
  }));
  const irrigationVolume = series.map((row) => ({
    x: row.timestamp as string,
    y: normalizeNumeric(row[`Vol_watering_${reactor}`])
  }));
  const freshWaterVolume = series.map((row) => ({
    x: row.timestamp as string,
    y: normalizeNumeric(row[`Vol_watering_${reactor}_fw`])
  }));
  const powerSeries = series.map((row) => ({
    x: row.timestamp as string,
    y: heatExtractionPowerKw(
      normalizeNumeric(row[`Q_VL_${reactor}`]),
      normalizeTemperaturePoint(row[`T_RL_${reactor}`]),
      normalizeTemperaturePoint(row[`T_VL_${reactor}`])
    )
  }));

  const timeseriesOptions: ChartOptions<'line'> = {
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'PPpp' }
      },
      y: {
        beginAtZero: false
      }
    }
  };
  const powerOptions: ChartOptions<'line'> = {
    scales: {
      x: {
        type: 'time',
        time: { tooltipFormat: 'PPpp' }
      },
      y: {
        position: 'left',
        title: {
          display: true,
          text: 'kW'
        }
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: '°C'
        }
      }
    }
  };

  return (
    <section className="panel reactor-history-panel">
      <div className="panel-header">
        <div>
          <h2>{reactor}</h2>
          <p className="muted">
            {series.length} Datenpunkte · letzter Datenpunkt {typeof last?.timestamp === 'string' ? formatDateTime(last.timestamp) : 'kein Wert'}
          </p>
        </div>
      </div>
      <div className="reactor-history-grid">
        <TimeSeriesChart
          compact
          title={`Temperaturen ${reactor}`}
          data={{
            datasets: [
              ...tags.temperature.map((tag, index) => ({
                label: formatSeriesLabel(tag.label),
                data: makePoints(series, tag.key),
                borderColor: sensorColors[index % sensorColors.length],
                borderWidth: tag.key.includes('Innenraum') ? 2 : 1,
                pointRadius: 0,
                tension: 0.15
              })),
              {
                label: 'Durchschnitt',
                data: temperatureAverage,
                borderColor: '#ffffff',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.18
              }
            ]
          }}
          options={timeseriesOptions}
        />
        <TimeSeriesChart
          compact
          title={`Feuchtigkeit ${reactor}`}
          data={{
            datasets: [
              {
                label: 'oben',
                data: makePoints(series, `HUM_oben_${reactor}`),
                borderColor: humidityColors[0],
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.12
              },
              {
                label: 'unten',
                data: makePoints(series, `HUM_unten_${reactor}`),
                borderColor: humidityColors[1],
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.12
              },
              {
                label: 'Durchschnitt',
                data: humidityAverage,
                borderColor: '#ffffff',
                borderWidth: 3,
                pointRadius: 0,
                tension: 0.18
              }
            ]
          }}
          options={timeseriesOptions}
        />
        <TimeSeriesChart
          compact
          title={`Aktoren ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Bewässerung',
                data: makeBinaryPoints(series, `Q_IRR_${reactor}`),
                borderColor: actionColors.irrigation,
                stepped: true,
                borderWidth: 2,
                pointRadius: 0
              },
              {
                label: 'Wärmeentzug',
                data: makeBinaryPoints(series, `V${reactor.slice(1)}_1_V_VL`),
                borderColor: actionColors.heatExtraction,
                stepped: true,
                borderWidth: 2,
                pointRadius: 0
              },
              {
                label: 'Belüftung',
                data: makeBinaryPoints(series, `V${reactor.slice(1)}_3_V_AER`),
                borderColor: actionColors.ventilation,
                stepped: true,
                borderWidth: 2,
                pointRadius: 0
              },
              {
                label: 'Frischwasser',
                data: makeBinaryPoints(series, `V${reactor.slice(1)}_4_V_FW`),
                borderColor: actionColors.freshWater,
                stepped: true,
                borderWidth: 2,
                pointRadius: 0
              },
              {
                label: 'Abluft',
                data: makeBinaryPoints(series, `V${reactor.slice(1)}_2_V_AER`),
                borderColor: actionColors.exhaust,
                stepped: true,
                borderWidth: 2,
                pointRadius: 0
              }
            ]
          }}
          options={timeseriesOptions}
        />
        <TimeSeriesChart
          compact
          title={`Wärmeentzug ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Leistung',
                data: powerSeries,
                borderColor: '#f59e0b',
                borderWidth: 3,
                pointRadius: 0,
                yAxisID: 'y'
              },
              {
                label: 'Vorlauf',
                data: series.map((row) => ({ x: row.timestamp as string, y: normalizeTemperaturePoint(row[`T_VL_${reactor}`]) })),
                borderColor: '#38bdf8',
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y1'
              },
              {
                label: 'Rücklauf',
                data: series.map((row) => ({ x: row.timestamp as string, y: normalizeTemperaturePoint(row[`T_RL_${reactor}`]) })),
                borderColor: '#22c55e',
                borderWidth: 2,
                pointRadius: 0,
                yAxisID: 'y1'
              }
            ]
          }}
          options={powerOptions}
        />
        <TimeSeriesChart
          compact
          title={`Bewässerung ${reactor}`}
          data={{
            datasets: [
              {
                label: 'Temperatur',
                data: irrigationTemperature,
                borderColor: '#38bdf8',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.18
              },
              {
                label: 'Durchfluss',
                data: irrigationFlow,
                borderColor: actionColors.irrigation,
                borderWidth: 2,
                pointRadius: 0,
                stepped: true,
                yAxisID: 'y1'
              },
              {
                label: 'Gesamtvolumen',
                data: irrigationVolume,
                borderColor: actionColors.freshWater,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.12
              },
              {
                label: 'Frischwasser gesamt',
                data: freshWaterVolume,
                borderColor: actionColors.exhaust,
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.12
              }
            ]
          }}
          options={{
            ...timeseriesOptions,
            scales: {
              x: timeseriesOptions.scales?.x,
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: 'l / °C'
                }
              },
              y1: {
                position: 'right',
                grid: {
                  drawOnChartArea: false
                },
                title: {
                  display: true,
                  text: 'l/min'
                }
              }
            }
          }}
        />
      </div>
    </section>
  );
}
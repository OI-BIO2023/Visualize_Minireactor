import { useEffect, useMemo, useState } from 'react';
import { getData, getLatest } from '../lib/api';
import { demoHistorySeries, demoLatest } from '../lib/mock';
import { type ExperimentSeries, DEFAULT_EXPERIMENT_ID, EXPERIMENT_SERIES, getExperimentSeries, resolveExperimentRange } from '../config/experiments';
import { PeriodSelector } from './PeriodSelector';
import { GlobalHistoryPanel } from './GlobalHistoryPanel';
import { ReactorHistoryPanel } from './ReactorHistoryPanel';
import { REACTORS } from '../config/reactors';

const demoSeriesByReactor = {
  R1: demoHistorySeries('R1'),
  R2: demoHistorySeries('R2'),
  R3: demoHistorySeries('R3'),
  R4: demoHistorySeries('R4')
};

const buildDemoHistory = () => {
  const rawTemp = (value: number) => Math.round(value * 100);
  return demoSeriesByReactor.R1.map((row, index) => ({
    ...row,
    ...demoSeriesByReactor.R2[index],
    ...demoSeriesByReactor.R3[index],
    ...demoSeriesByReactor.R4[index],
    T_Speicher_oben: rawTemp(61 + index / 10),
    T_Speicher_unten: rawTemp(53 + index / 12),
    T_VL_global: rawTemp(34 + index / 15),
    T_FW: rawTemp(17 + index / 20),
    T_AER: rawTemp(26 + index / 18),
    T_Absaugung: rawTemp(28 + index / 18),
    T_Umgebung: rawTemp(22 + index / 25),
    CO_Sonde: 110 + index,
    CO2_Sonde: 2100 + index * 8,
    O2_Sonde: 18.5 + index / 100,
    CH4_Sonde: 40 + index / 4,
    C0_1_Komp_AER: index % 3 !== 0 ? 1 : 0,
    C0_2_Komp_AER: index % 4 !== 0 ? 1 : 0,
    P01_P02_Pn: 1,
    Mischventil_V01: 54
  }));
};

const mergeLatestPoint = (series: Record<string, unknown>[], latest: Record<string, unknown> | null) => {
  if (!latest || typeof latest.timestamp !== 'string') return series;
  const currentLast = series.at(-1);
  if (!currentLast || typeof currentLast.timestamp !== 'string') return [...series, latest];
  if (new Date(latest.timestamp).getTime() > new Date(currentLast.timestamp).getTime()) {
    return [...series, latest];
  }
  return series;
};

const isValidTimestamp = (value: unknown) => typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

const csvExcludedKeys = new Set(['expiresAt', 'ident', 'payload', 'pk', 'sk', 'type']);

const sanitizeCsvRows = (rows: Record<string, unknown>[]) =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).filter(([key, value]) => key === 'timestamp' || (!csvExcludedKeys.has(key) && (value == null || ['string', 'number', 'boolean'].includes(typeof value))))
    )
  );

const toCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return '';
  const sanitized = sanitizeCsvRows(rows);
  const headers = Array.from(new Set(['timestamp', ...sanitized.flatMap((row) => Object.keys(row))])).sort((a, b) => {
    if (a === 'timestamp') return -1;
    if (b === 'timestamp') return 1;
    return a.localeCompare(b);
  });
  const escapeCell = (value: unknown) => {
    if (value == null) return '';
    const text = typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const lines = [headers.join(';')];
  for (const row of sanitized) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(';'));
  }
  return `\uFEFF${lines.join('\n')}`;
};

export function HistoryDashboard() {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(DEFAULT_EXPERIMENT_ID);
  const [series, setSeries] = useState<Record<string, unknown>[]>(buildDemoHistory());

  const selectedExperiment: ExperimentSeries = useMemo(() => getExperimentSeries(selectedExperimentId), [selectedExperimentId]);
  const range = useMemo(() => resolveExperimentRange(selectedExperiment), [selectedExperiment]);

  useEffect(() => {
    let cancelled = false;
    const loadSeries = async () => {
      try {
        const [dataPayload, latestPayload] = await Promise.all([
          getData({ start: range.start, end: range.end, ident: 'MI', type: 'value' }),
          getLatest('MI')
        ]);
        if (cancelled) return;
        if (dataPayload.ok) {
          const merged = mergeLatestPoint(dataPayload.items, latestPayload.ok ? latestPayload.item : null);
          setSeries(merged.length ? merged : buildDemoHistory());
          return;
        }
        setSeries(buildDemoHistory());
      } catch {
        if (!cancelled) setSeries(buildDemoHistory());
      }
    };

    void loadSeries();
    const timer = window.setInterval(loadSeries, 120_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [range.end, range.start]);

  const filteredSeries = series.filter((row) => isValidTimestamp(row.timestamp));

  const downloadCsv = async (type: 'value' | 'event') => {
    const payload = await getData({ start: range.start, end: range.end, ident: 'MI', type });
    const rows = payload.ok ? sanitizeCsvRows(payload.items.filter((row) => isValidTimestamp(row.timestamp))) : sanitizeCsvRows(filteredSeries);
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `minireactor-${type}-${range.start.slice(0, 10)}_${range.end.slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="page">
      <header className="hero hero-top">
        <div>
          <h1>Historie</h1>
        </div>
        <div className="chip-row">
          <button type="button" className="filter-button" onClick={() => void downloadCsv('value')}>
            CSV Wertdaten
          </button>
          <button type="button" className="filter-button" onClick={() => void downloadCsv('event')}>
            CSV Ereignisse
          </button>
          <a href="/" className="back-link">
            Zur Live-Ansicht
          </a>
        </div>
      </header>
      <PeriodSelector experiments={EXPERIMENT_SERIES} selectedExperimentId={selectedExperimentId} onSelectExperiment={setSelectedExperimentId} />
      <GlobalHistoryPanel series={filteredSeries} />
      <div className="history-grid">
        {REACTORS.map((reactor) => (
          <ReactorHistoryPanel key={reactor} reactor={reactor} series={filteredSeries} />
        ))}
      </div>
    </main>
  );
}

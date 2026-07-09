import { useEffect, useMemo, useState } from 'react';
import { getBatches, getData, getLatest } from '../lib/api';
import { demoBatches, demoHistorySeries, demoLatest } from '../lib/mock';
import { type Batch } from '../lib/derived';
import { PeriodSelector } from './PeriodSelector';
import { ReactorHistoryPanel } from './ReactorHistoryPanel';
import { formatDateTime } from '../lib/time';
import { REACTORS } from '../config/reactors';

const defaultRange = {
  start: demoBatches[0].fill_at,
  end: demoBatches[demoBatches.length - 1].empty_at ?? demoLatest.timestamp
};

const demoSeriesByReactor = {
  R1: demoHistorySeries('R1'),
  R2: demoHistorySeries('R2'),
  R3: demoHistorySeries('R3'),
  R4: demoHistorySeries('R4')
};

const buildDemoHistory = () => {
  const frames = demoSeriesByReactor.R1.map((row, index) => ({
    ...row,
    ...demoSeriesByReactor.R2[index],
    ...demoSeriesByReactor.R3[index],
    ...demoSeriesByReactor.R4[index],
    T_Speicher_oben: 61 + index / 10,
    T_Speicher_unten: 53 + index / 12,
    T_VL_global: 34 + index / 15,
    T_FW: 17 + index / 20,
    T_AER: 26 + index / 18,
    T_Absaugung: 28 + index / 18,
    T_Umgebung: 22 + index / 25,
    CO_Sonde: 110 + index,
    CO2_Sonde: 2100 + index * 8,
    O2_Sonde: 18.5 + index / 100,
    CH4_Sonde: 40 + index / 4,
    C0_1_Komp_AER: index % 3 !== 0 ? 1 : 0,
    C0_2_Komp_AER: index % 4 !== 0 ? 1 : 0,
    P01_P02_Pn: 1,
    Mischventil_V01: 54
  }));
  return frames;
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

export function HistoryDashboard() {
  const [batches, setBatches] = useState<Batch[]>(demoBatches);
  const [range, setRange] = useState(defaultRange);
  const [rangeInitialized, setRangeInitialized] = useState(false);
  const [series, setSeries] = useState<Record<string, unknown>[]>(buildDemoHistory());

  const availableRange = useMemo(() => {
    const starts = batches.map((batch) => new Date(batch.fill_at).getTime()).filter((value) => Number.isFinite(value));
    const ends = batches.map((batch) => new Date(batch.empty_at ?? demoLatest.timestamp).getTime()).filter((value) => Number.isFinite(value));
    const minStart = starts.length ? new Date(Math.min(...starts)).toISOString() : defaultRange.start;
    const maxEnd = ends.length ? new Date(Math.max(...ends)).toISOString() : defaultRange.end;
    return { start: minStart, end: maxEnd };
  }, [batches]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await getBatches();
        if (!cancelled && payload.ok && payload.batches.length) {
          setBatches(payload.batches);
        }
      } catch {
        if (!cancelled) setBatches(demoBatches);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!rangeInitialized) {
      setRange(availableRange);
      setRangeInitialized(true);
    }
  }, [availableRange, rangeInitialized]);

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
  }, [range]);

  return (
    <main className="page">
      <header className="hero hero-top">
        <div>
          <h1>Historie</h1>
          <p className="muted">Alle Reaktoren in einem gemeinsamen Zeitfenster.</p>
        </div>
        <a href="/" className="back-link">
          Zur Live-Ansicht
        </a>
      </header>
      <PeriodSelector range={range} availableRange={availableRange} onChange={setRange} />
      <section className="panel">
        <p className="muted">
          Zeitraum: {formatDateTime(range.start)} bis {formatDateTime(range.end)}
        </p>
      </section>
      <div className="history-grid">
        {REACTORS.map((reactor) => (
          <ReactorHistoryPanel key={reactor} reactor={reactor} series={series.filter((row) => isValidTimestamp(row.timestamp))} />
        ))}
      </div>
    </main>
  );
}
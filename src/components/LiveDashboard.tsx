import { useEffect, useMemo, useState } from 'react';
import { getLatest } from '../lib/api';
import { demoLatest } from '../lib/mock';
import { assignGasReactor, getExhaustAnalysisState } from '../lib/derived';
import { formatDateTime } from '../lib/time';
import { GlobalOverview } from './GlobalOverview';
import { ReactorCard } from './ReactorCard';
import { GasPanel } from './GasPanel';
import { QualityBadge } from './QualityBadge';
import type { QualityFlag } from '../lib/quality';

export function LiveDashboard() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLatest = async () => {
      try {
        const latest = await getLatest('MI');
        if (cancelled) return;
        if (latest.ok && latest.item) {
          setData(latest.item);
          setTimestamp(latest.timestamp);
          setMessage(null);
          return;
        }
        setData(demoLatest);
        setTimestamp(demoLatest.timestamp);
        setMessage(latest.message ?? 'Keine Live-Daten, Demo-Daten angezeigt.');
      } catch {
        if (cancelled) return;
        setData(demoLatest);
        setTimestamp(demoLatest.timestamp);
        setMessage('Backend nicht erreichbar, Demo-Daten angezeigt.');
      }
    };

    void loadLatest();
    const timer = window.setInterval(loadLatest, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const exhaustState = useMemo(() => (data ? getExhaustAnalysisState(data) : { active: false, reactor: 'unassigned' }), [data]);

  const gasAssignment = useMemo(() => {
    const assigned = data ? assignGasReactor(data) : 'unassigned';
    if (assigned === 'ambiguous' || assigned === 'unassigned') return 'nicht zugeordnet';
    return assigned;
  }, [data]);

  const qualityFlags = useMemo<QualityFlag[]>(() => {
    const flags: QualityFlag[] = [];
    if (!data) flags.push('missing');
    if (timestamp) {
      const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
      if (Number.isFinite(ageMinutes) && ageMinutes > 60) flags.push('stale');
    }
    if (data && assignGasReactor(data) === 'ambiguous') flags.push('ambiguousGasAssignment');
    return flags;
  }, [data, timestamp]);

  return (
    <main className="page">
      <header className="hero">
        <div className="brand-row">
          <div className="brand-mark">
            <img src="/logo_biologik.png" alt="Biologik" />
          </div>
          <div>
            <h1>Mini-Reaktoren Monitoring</h1>
            <p className="muted">Anlagen-ID: MI</p>
          </div>
        </div>
        <div className="hero-meta">
          <span className="status-badge success">Online ohne Login</span>
          <span className="status-badge">{formatDateTime(timestamp)}</span>
        </div>
      </header>
      {qualityFlags.length ? (
        <div className="chip-row">
          {qualityFlags.map((flag) => (
            <QualityBadge key={flag} flag={flag} />
          ))}
        </div>
      ) : null}
      {message ? <p className="hint">{message}</p> : null}
      <GlobalOverview data={data} lastTimestamp={timestamp} flags={qualityFlags} />
      <div className="reactor-tabs">
        {(['R1', 'R2', 'R3', 'R4'] as const).map((reactor) => (
          <ReactorCard key={reactor} reactor={reactor} data={data} flags={[]} activeGas={gasAssignment} />
        ))}
      </div>
      <GasPanel data={data} assignedTo={String(gasAssignment)} timestamp={timestamp} flags={qualityFlags} processState={{ active: exhaustState.active, reactor: String(exhaustState.reactor) }} />
    </main>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { getLatest } from '../lib/api';
import { demoLatest } from '../lib/mock';
import { assignGasReactor } from '../lib/derived';
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
    (async () => {
      try {
        const latest = await getLatest('MI');
        if (cancelled) return;
        if (latest.ok && latest.item) {
          setData(latest.item);
          setTimestamp(latest.timestamp);
        } else {
          setData(demoLatest);
          setTimestamp(demoLatest.timestamp);
          setMessage(latest.message ?? 'Keine Live-Daten, Demo-Daten angezeigt.');
        }
      } catch {
        if (cancelled) return;
        setData(demoLatest);
        setTimestamp(demoLatest.timestamp);
        setMessage('Backend nicht erreichbar, Demo-Daten angezeigt.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const gasAssignment = useMemo(() => {
    const assigned = data ? assignGasReactor(data) : 'unassigned';
    if (assigned === 'ambiguous') return 'nicht zugeordnet';
    if (assigned === 'unassigned') return 'nicht zugeordnet';
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
          <div className="brand-mark" aria-label="Biologik logo">
            <svg viewBox="0 0 240 64" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="brand-grad" x1="0" x2="1">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>
              </defs>
              <rect width="240" height="64" rx="14" fill="#0b1220" />
              <circle cx="34" cy="32" r="16" fill="url(#brand-grad)" />
              <path d="M29 32c4-9 8-12 10-12 1 0 2 1 2 2 0 3-4 4-4 10 0 4 3 6 3 10 0 2-2 4-4 4-3 0-6-3-7-14Z" fill="#f8fafc" />
              <text x="64" y="38" fill="#e2e8f0" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700">
                Biologik
              </text>
            </svg>
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
      <GasPanel data={data} assignedTo={String(gasAssignment)} timestamp={timestamp} flags={qualityFlags} />
      <nav className="page-nav">
        <a href="/history">Historie Ã¶ffnen</a>
      </nav>
    </main>
  );
}

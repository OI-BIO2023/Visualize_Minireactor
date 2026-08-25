import { describe, expect, it } from 'vitest';
import { formatStaleDuration, isMissingOrStale, isStale, minutesSince } from '../src/lib/staleness';

const NOW = new Date('2026-08-24T12:00:00.000Z').getTime();

describe('staleness helpers', () => {
  it('detects stale measurements after one hour', () => {
    const now = Date.parse('2026-07-09T15:00:00Z');
    expect(isStale('2026-07-09T13:59:59Z', 60, now)).toBe(true);
    expect(isStale('2026-07-09T14:00:01Z', 60, now)).toBe(false);
  });

  it('formats age and computes minutes since', () => {
    const now = Date.parse('2026-07-09T15:00:00Z');
    expect(minutesSince('2026-07-09T14:30:00Z', now)).toBeCloseTo(30);
    expect(formatStaleDuration('2026-07-09T13:30:00Z', now)).toBe('1.5 h');
  });
});

describe('HMI stale alert decision', () => {
  it('alerts when no MI heartbeat has ever been stored', () => {
    expect(isMissingOrStale(null, 60, NOW)).toBe(true);
  });

  it('does not alert while the latest complete MI frame is recent', () => {
    expect(isMissingOrStale('2026-08-24T11:01:00.000Z', 60, NOW)).toBe(false);
  });

  it('alerts after the latest complete MI frame is older than the threshold', () => {
    expect(isMissingOrStale('2026-08-24T10:59:00.000Z', 60, NOW)).toBe(true);
  });

  it('would detect the outage from 15 to 24 August', () => {
    expect(isMissingOrStale('2026-08-15T12:00:00.000Z', 60, NOW)).toBe(true);
  });
});

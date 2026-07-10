import { describe, expect, it } from 'vitest';
import { formatStaleDuration, isStale, minutesSince } from '../src/lib/staleness';

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

import { describe, expect, it } from 'vitest';
import { assignGasReactor, freshWaterShare, heatExtractionPowerKw, integrateEnergyKwh, findBatchForTimestamp } from '../src/lib/derived';
import batches from '../data/reactor_batches.json';

describe('derived calculations', () => {
  it('computes heat extraction power', () => {
    expect(heatExtractionPowerKw(6, 36, 30)).toBeCloseTo(2.5116, 4);
  });

  it('computes fresh water share', () => {
    expect(freshWaterShare(100, 40)).toBeCloseTo(0.4);
  });

  it('integrates energy over time', () => {
    const energy = integrateEnergyKwh([
      { timestamp: '2026-07-01T00:00:00Z', powerKw: 2 },
      { timestamp: '2026-07-01T01:00:00Z', powerKw: 2 }
    ]);
    expect(energy).toBeCloseTo(2);
  });

  it('assigns gas to a reactor', () => {
    expect(assignGasReactor({ F_Absaugung: 10, V2_2_V_AER: 1 })).toBe('R2');
  });

  it('finds batch by timestamp', () => {
    const batch = findBatchForTimestamp(batches as never, 'R1', '2026-07-02T00:00:00+02:00');
    expect(batch?.batch_id).toBe('MI-R1-2026-07-01');
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeDynamoPayload } from '../src/lib/normalize';

describe('normalizeDynamoPayload', () => {
  it('flattens DynamoDB maps', () => {
    const payload = normalizeDynamoPayload({
      pk: { S: 'DEVICE#MI' },
      value: { M: { T_FW: { N: '17.4' } } }
    });
    expect(payload.pk).toBe('DEVICE#MI');
    expect((payload.value as Record<string, unknown>).T_FW).toBe(17.4);
  });

  it('keeps nested live payloads available for flattening', () => {
    const payload = normalizeDynamoPayload({
      payload: {
        T_VL_R1: 33.7,
        Q_IRR_R1: 1
      },
      ts: '2026-07-09T13:44:34.392743Z'
    });

    expect(payload.payload).toEqual({ T_VL_R1: 33.7, Q_IRR_R1: 1 });
    expect(payload.ts).toBe('2026-07-09T13:44:34.392743Z');
  });
});

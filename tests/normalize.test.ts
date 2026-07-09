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
});

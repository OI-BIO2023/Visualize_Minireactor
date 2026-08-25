import { marshall } from '@aws-sdk/util-dynamodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ ddbSend: vi.fn() }));

vi.mock('../netlify/functions/_shared', () => ({
  alertConfig: {
    heartbeatPkPrefix: 'HEARTBEAT#',
    heartbeatSk: 'HMI#VALUE',
    heartbeatField: 'K.T1',
    thresholdMinutes: 60,
    sourceLagAllowanceMinutes: 180,
    valueRetentionDays: 90
  },
  config: {
    tableName: 'plant_ingest',
    pkName: 'pk',
    skName: 'sk',
    identPrefix: 'DEVICE#',
    tsPrefix: 'TS#'
  },
  ddb: { send: mocks.ddbSend },
  normalizeRecord: (item: Record<string, unknown>) => ({ ...item, timestamp: item.ts })
}));

import { fetchHmiHeartbeat } from '../netlify/functions/_heartbeat';

describe('HMI heartbeat lookup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('falls back to a recent complete MI measurement during rollout', async () => {
    mocks.ddbSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Items: [
          marshall({
            pk: 'DEVICE#MI',
            sk: 'TS#2026-08-25T10:00:00.000Z#VALUE',
            type: 'value',
            ts: '2026-08-25T10:00:00.000Z',
            payload: { 'K.T1': 31.9 }
          })
        ]
      });

    await expect(fetchHmiHeartbeat('MI', 60)).resolves.toEqual({
      ident: 'MI',
      lastSeenAt: '2026-08-25T10:00:00.000Z'
    });
    expect(mocks.ddbSend).toHaveBeenCalledTimes(2);
  });

  it('reports no heartbeat when no complete frame exists in the threshold window', async () => {
    mocks.ddbSend.mockResolvedValueOnce({}).mockResolvedValueOnce({ Items: [] });

    await expect(fetchHmiHeartbeat('MI', 60)).resolves.toBeNull();
  });

  it('uses the inferred AWS ingest time instead of the delayed HMI source time', async () => {
    const observedAt = new Date('2026-08-25T13:03:47.000Z');
    const expiresAt = Math.floor(observedAt.getTime() / 1000) + 90 * 86_400;
    mocks.ddbSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        Items: [
          marshall({
            pk: 'DEVICE#MI',
            sk: 'TS#2026-08-25T11:50:42.334077Z#VALUE',
            type: 'value',
            ts: '2026-08-25T11:50:42.334077Z',
            expiresAt,
            payload: { 'K.T1': 31.9 }
          })
        ]
      });

    await expect(fetchHmiHeartbeat('MI', 60)).resolves.toEqual({
      ident: 'MI',
      lastSeenAt: observedAt.toISOString()
    });
  });
});

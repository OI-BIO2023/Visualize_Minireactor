import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchHmiHeartbeat: vi.fn(),
  sendMail: vi.fn(),
  stateGet: vi.fn(),
  stateSetJSON: vi.fn()
}));

vi.mock('@netlify/blobs', () => ({
  getStore: () => ({ get: mocks.stateGet, setJSON: mocks.stateSetJSON })
}));

vi.mock('../netlify/functions/_shared', () => ({
  alertConfig: {
    enabled: true,
    recipient: 'operator@example.com',
    thresholdMinutes: 60,
    smtpHost: 'smtp.example.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: 'sender@example.com',
    smtpPass: 'test-password',
    smtpFrom: '',
    alertStatePkPrefix: 'ALERT#',
    alertStateSk: 'STALE#EMAIL',
    heartbeatPkPrefix: 'HEARTBEAT#',
    heartbeatSk: 'HMI#VALUE'
  },
  config: {
    tableName: 'plant_ingest',
    pkName: 'pk',
    skName: 'sk'
  },
  json: (statusCode: number, body: unknown) => ({ statusCode, body: JSON.stringify(body) }),
  validateIdent: (ident: string) => ident
}));

vi.mock('../netlify/functions/_heartbeat', () => ({
  fetchHmiHeartbeat: mocks.fetchHmiHeartbeat
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: mocks.sendMail })
  }
}));

import { handler } from '../netlify/functions/stale-alert';

describe('scheduled HMI stale alert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendMail.mockResolvedValue({ messageId: 'test' });
    mocks.stateGet.mockResolvedValue(null);
    mocks.stateSetJSON.mockResolvedValue({ modified: true });
  });

  it('sends an email when no complete MI heartbeat exists', async () => {
    mocks.fetchHmiHeartbeat.mockResolvedValue(null);

    const response = await handler();

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ sent: true, stale: true, timestamp: null });
    expect(mocks.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'operator@example.com',
        subject: '[MiniReactor] Datenstopp MI'
      })
    );
  });

  it('does not send while complete MI frames are current', async () => {
    mocks.fetchHmiHeartbeat.mockResolvedValue({ ident: 'MI', lastSeenAt: new Date().toISOString() });

    const response = await handler();

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ sent: false, stale: false });
    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.stateGet).not.toHaveBeenCalled();
  });
});

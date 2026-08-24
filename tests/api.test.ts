import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllData } from '../src/lib/api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAllData', () => {
  it('loads every server page and returns the records chronologically', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            items: [{ timestamp: '2026-08-16T00:00:00.000Z' }],
            count: 1,
            start: '2026-07-13T00:00:00.000Z',
            end: '2026-08-24T00:00:00.000Z',
            truncated: true,
            nextCursor: 'page-2'
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            items: [{ timestamp: '2026-07-13T00:00:00.000Z' }],
            count: 1,
            start: '2026-07-13T00:00:00.000Z',
            end: '2026-08-24T00:00:00.000Z',
            truncated: false,
            nextCursor: null
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const rows = await getAllData({
      start: '2026-07-13T00:00:00.000Z',
      end: '2026-08-24T00:00:00.000Z',
      type: 'value',
      limit: 5000
    });

    expect(rows.map((row) => row.timestamp)).toEqual([
      '2026-07-13T00:00:00.000Z',
      '2026-08-16T00:00:00.000Z'
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain('cursor=page-2');
  });

  it('fails instead of silently exporting a truncated response without a cursor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            items: [{ timestamp: '2026-08-15T00:00:00.000Z' }],
            count: 1,
            start: '2026-07-13T00:00:00.000Z',
            end: '2026-08-24T00:00:00.000Z',
            truncated: true
          }),
          { status: 200 }
        )
      )
    );

    await expect(
      getAllData({
        start: '2026-07-13T00:00:00.000Z',
        end: '2026-08-24T00:00:00.000Z',
        type: 'value',
        limit: 5000
      })
    ).rejects.toThrow('vollst\u00e4ndigen Datensatz');
  });
});

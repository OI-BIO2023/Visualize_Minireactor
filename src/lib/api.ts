import type { Batch } from './derived';

export type LatestResponse = {
  ok: boolean;
  item: Record<string, unknown> | null;
  timestamp: string | null;
  flags: string[];
  source?: string;
  message?: string;
};

export type DataResponse = {
  ok: boolean;
  items: Record<string, unknown>[];
  count: number;
  start: string;
  end: string;
  truncated?: boolean;
  nextCursor?: string | null;
  message?: string;
};

export type DataQuery = {
  ident?: string;
  start: string;
  end: string;
  type?: string;
  limit?: number;
  cursor?: string;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const fetchJson = async <T>(url: string, attempts = 3): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await sleep(250 * (attempt + 1));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
};

export const getLatest = (ident = 'MI') => fetchJson<LatestResponse>(`/.netlify/functions/latest?ident=${encodeURIComponent(ident)}`);

export const getData = (params: DataQuery) =>
  fetchJson<DataResponse>(
    `/.netlify/functions/data?ident=${encodeURIComponent(params.ident ?? 'MI')}&start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}&type=${encodeURIComponent(params.type ?? 'value')}${params.limit !== undefined ? `&limit=${encodeURIComponent(String(params.limit))}` : ''}${params.cursor ? `&cursor=${encodeURIComponent(params.cursor)}` : ''}`
  );

export const getAllData = async (params: Omit<DataQuery, 'cursor'>): Promise<Record<string, unknown>[]> => {
  const items: Record<string, unknown>[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;

  do {
    const payload = await getData({ ...params, cursor });
    if (!payload.ok) throw new Error(payload.message ?? 'Daten konnten nicht geladen werden');
    items.push(...payload.items);

    if (!payload.truncated) break;
    if (!payload.nextCursor || seenCursors.has(payload.nextCursor)) {
      throw new Error('Der Server konnte den vollst\u00e4ndigen Datensatz nicht paginieren');
    }
    seenCursors.add(payload.nextCursor);
    cursor = payload.nextCursor;
  } while (cursor);

  return items.sort((left, right) => {
    const leftTime = typeof left.timestamp === 'string' ? new Date(left.timestamp).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = typeof right.timestamp === 'string' ? new Date(right.timestamp).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
};

export const getBatches = () => fetchJson<{ ok: boolean; batches: Batch[] }>(`/.netlify/functions/batches`);

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
  message?: string;
};

export const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
};

export const getLatest = (ident = 'MI') => fetchJson<LatestResponse>(`/.netlify/functions/latest?ident=${encodeURIComponent(ident)}`);

export const getData = (params: { ident?: string; start: string; end: string; type?: string }) =>
  fetchJson<DataResponse>(
    `/.netlify/functions/data?ident=${encodeURIComponent(params.ident ?? 'MI')}&start=${encodeURIComponent(params.start)}&end=${encodeURIComponent(params.end)}&type=${encodeURIComponent(params.type ?? 'value')}`
  );

export const getBatches = () => fetchJson<{ ok: boolean; batches: Batch[] }>(`/.netlify/functions/batches`);

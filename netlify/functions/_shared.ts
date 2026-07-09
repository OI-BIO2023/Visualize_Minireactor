import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import batches from '../../data/reactor_batches.json';
import { normalizeDynamoPayload, extractTimestamp } from '../../src/lib/normalize';
import { clampDateRange } from '../../src/lib/time';
import type { Batch } from '../../src/lib/derived';

const env = (key: string, fallback = '') => process.env[key] ?? fallback;
const envAny = (keys: string[], fallback = '') => {
  for (const key of keys) {
    const value = process.env[key];
    if (value != null && value !== '') return value;
  }
  return fallback;
};

export const config = {
  tableName: envAny(['MY_DDB_TABLE', 'DDB_TABLE']),
  pkName: envAny(['MY_DDB_PK_NAME', 'DDB_PK_NAME'], 'pk'),
  skName: envAny(['MY_DDB_SK_NAME', 'DDB_SK_NAME'], 'sk'),
  identPrefix: envAny(['MY_DDB_IDENT_PREFIX', 'DDB_IDENT_PREFIX'], 'DEVICE#'),
  tsPrefix: envAny(['MY_DDB_TS_PREFIX', 'DDB_TS_PREFIX'], 'TS#'),
  allowedIdents: new Set(envAny(['MY_ALLOWED_IDENTS', 'ALLOWED_IDENTS'], 'MI').split(',').map((value) => value.trim()).filter(Boolean)),
  maxQueryDays: Number(envAny(['MY_MAX_QUERY_DAYS', 'MAX_QUERY_DAYS'], '90')),
  cacheTtlSeconds: Number(envAny(['MY_CACHE_TTL_SECONDS', 'CACHE_TTL_SECONDS'], '30'))
};

export const ddb = new DynamoDBClient({
  region: envAny(['MY_AWS_REGION', 'AWS_REGION'], 'eu-central-1'),
  maxAttempts: 3,
  credentials:
    envAny(['MY_AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID']) && envAny(['MY_AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY'])
      ? {
          accessKeyId: envAny(['MY_AWS_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID']),
          secretAccessKey: envAny(['MY_AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY'])
        }
      : undefined
});

export const json = (statusCode: number, body: unknown, headers: Record<string, string> = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  },
  body: JSON.stringify(body)
});

export const parseQuery = (event: { queryStringParameters?: Record<string, string | undefined> }, key: string): string | null =>
  event.queryStringParameters?.[key] ?? null;

export const validateIdent = (ident: string | null): string => {
  if (!ident) throw new Error('Missing ident');
  if (!config.allowedIdents.has(ident)) throw new Error(`Ident ${ident} not allowed`);
  return ident;
};

export const normalizeRecord = (item: Record<string, unknown> | undefined | null) => {
  if (!item) return null;
  const normalized = normalizeDynamoPayload(item);
  const payload = normalized.payload;
  const flattened =
    typeof payload === 'object' && payload !== null && !Array.isArray(payload)
      ? {
          ...normalized,
          ...(payload as Record<string, unknown>)
        }
      : normalized;
  const timestamp = extractTimestamp(flattened);
  return { ...flattened, timestamp };
};

export const batchData = batches as Batch[];

export const normalizeBatchRange = (start: string, end: string) => clampDateRange(start, end, config.maxQueryDays);

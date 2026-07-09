import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import batches from '../../data/reactor_batches.json';
import { normalizeDynamoPayload, extractTimestamp } from '../../src/lib/normalize';
import { clampDateRange } from '../../src/lib/time';
import type { Batch } from '../../src/lib/derived';

const env = (key: string, fallback = '') => process.env[key] ?? fallback;

export const config = {
  tableName: env('DDB_TABLE'),
  pkName: env('DDB_PK_NAME', 'pk'),
  skName: env('DDB_SK_NAME', 'sk'),
  identPrefix: env('DDB_IDENT_PREFIX', 'DEVICE#'),
  tsPrefix: env('DDB_TS_PREFIX', 'TS#'),
  allowedIdents: new Set(env('ALLOWED_IDENTS', 'MI').split(',').map((value) => value.trim()).filter(Boolean)),
  maxQueryDays: Number(env('MAX_QUERY_DAYS', '90')),
  cacheTtlSeconds: Number(env('CACHE_TTL_SECONDS', '30'))
};

export const ddb = new DynamoDBClient({
  region: env('AWS_REGION', 'eu-central-1'),
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
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
  const timestamp = extractTimestamp(normalized);
  return { ...normalized, timestamp };
};

export const batchData = batches as Batch[];

export const normalizeBatchRange = (start: string, end: string) => clampDateRange(start, end, config.maxQueryDays);

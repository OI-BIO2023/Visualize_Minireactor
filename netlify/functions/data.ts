import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { config, ddb, json, normalizeRecord, parseQuery, validateIdent, normalizeBatchRange } from './_shared';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';
import { minutesBetween } from '../../src/lib/time';

const cacheHeadersForRange = (start: string, end: string) => {
  const hours = minutesBetween(start, end) / 60;
  const maxAge = hours <= 2 ? config.cacheTtlSeconds : hours <= 48 ? Math.max(config.cacheTtlSeconds * 4, 120) : 900;
  return { 'Cache-Control': `public, max-age=${maxAge}` };
};

export const handler = async (event: { queryStringParameters?: Record<string, string | undefined> }) => {
  try {
    const ident = validateIdent(parseQuery(event, 'ident') ?? 'MI');
    const start = parseQuery(event, 'start');
    const end = parseQuery(event, 'end');
    const type = parseQuery(event, 'type') ?? 'value';

    if (!config.tableName) return json(500, { ok: false, message: 'DDB_TABLE is not configured' });
    if (!start || !end) return json(400, { ok: false, message: 'start and end are required' });

    const range = normalizeBatchRange(start, end);
    const params = {
      TableName: config.tableName,
      KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#pk': config.pkName,
        '#sk': config.skName,
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':pk': { S: `${config.identPrefix}${ident}` },
        ':start': { S: `${config.tsPrefix}${range.start}` },
        ':end': { S: `${config.tsPrefix}${range.end}#~` },
        ':type': { S: type }
      },
      FilterExpression: '#type = :type'
    } as const;

    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, AttributeValue> | undefined;

    do {
      const response = await ddb.send(new QueryCommand({ ...params, ExclusiveStartKey }));
      for (const item of response.Items ?? []) {
        const flat = unmarshall(item);
        const normalized = normalizeRecord(flat);
        if (normalized) items.push(normalized);
      }
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return json(
      200,
      {
        ok: true,
        items,
        count: items.length,
        start: range.start,
        end: range.end
      },
      cacheHeadersForRange(range.start, range.end)
    );
  } catch (error) {
    return json(400, { ok: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

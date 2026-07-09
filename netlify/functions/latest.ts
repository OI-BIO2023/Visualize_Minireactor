import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { config, ddb, json, normalizeRecord, parseQuery, validateIdent } from './_shared';

const windows = [1, 24, 24 * 7, 24 * 30];

export const handler = async (event: { queryStringParameters?: Record<string, string | undefined> }) => {
  try {
    const ident = validateIdent(parseQuery(event, 'ident') ?? 'MI');
    if (!config.tableName) return json(500, { ok: false, message: 'DDB_TABLE is not configured' });

    const now = new Date();
    for (const hours of windows) {
      const start = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
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
          ':start': { S: `${config.tsPrefix}${start}` },
          ':end': { S: `${config.tsPrefix}${now.toISOString()}#~` },
          ':type': { S: 'value' }
        },
        FilterExpression: '#type = :type',
        ScanIndexForward: false
      } as const;

      const response = await ddb.send(new QueryCommand(params));
      const items = (response.Items ?? []).map((item) => normalizeRecord(unmarshall(item))).filter(Boolean) as Record<string, unknown>[];
      if (items.length) {
        const item = items[0];
        const timestamp = typeof item.timestamp === 'string' ? item.timestamp : null;
        return json(
          200,
          {
            ok: true,
            item,
            timestamp,
            flags: [],
            source: `${hours}h`
          },
          {
            'Cache-Control': `public, max-age=${Math.max(5, config.cacheTtlSeconds)}`
          }
        );
      }
    }

    return json(404, { ok: false, item: null, timestamp: null, flags: [], message: 'No valid latest record found' }, { 'Cache-Control': 'public, max-age=5' });
  } catch (error) {
    return json(400, { ok: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

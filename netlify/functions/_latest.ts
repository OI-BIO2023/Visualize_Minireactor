import { QueryCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { config, ddb, normalizeRecord } from './_shared';

const windows = [1, 24, 24 * 7, 24 * 30];

export const fetchLatestRecord = async (ident: string) => {
  if (!config.tableName) return null;

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
      return {
        item,
        timestamp,
        source: `${hours}h`
      };
    }
  }

  return null;
};

import { GetItemCommand, QueryCommand, type AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { alertConfig, config, ddb, normalizeRecord } from './_shared';

export type HmiHeartbeat = {
  ident: string;
  lastSeenAt: string;
};

const fetchRecentMeasurement = async (ident: string, lookbackMinutes: number): Promise<HmiHeartbeat | null> => {
  const now = new Date();
  const start = new Date(now.getTime() - lookbackMinutes * 60_000).toISOString();
  let ExclusiveStartKey: Record<string, AttributeValue> | undefined;

  do {
    const response = await ddb.send(
      new QueryCommand({
        TableName: config.tableName,
        KeyConditionExpression: '#pk = :pk AND #sk BETWEEN :start AND :end',
        FilterExpression: '#type = :value AND attribute_exists(#payload.#heartbeatField)',
        ExpressionAttributeNames: {
          '#pk': config.pkName,
          '#sk': config.skName,
          '#type': 'type',
          '#payload': 'payload',
          '#heartbeatField': alertConfig.heartbeatField
        },
        ExpressionAttributeValues: {
          ':pk': { S: `${config.identPrefix}${ident}` },
          ':start': { S: `${config.tsPrefix}${start}` },
          ':end': { S: `${config.tsPrefix}${now.toISOString()}#~` },
          ':value': { S: 'value' }
        },
        ExclusiveStartKey,
        ScanIndexForward: false,
        ConsistentRead: true,
        Limit: 250
      })
    );
    const item = response.Items?.[0];
    if (item) {
      const normalized = normalizeRecord(unmarshall(item));
      const timestamp = normalized && typeof normalized.timestamp === 'string' ? normalized.timestamp : null;
      if (timestamp) return { ident, lastSeenAt: timestamp };
    }
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return null;
};

export const fetchHmiHeartbeat = async (ident: string, lookbackMinutes = alertConfig.thresholdMinutes): Promise<HmiHeartbeat | null> => {
  if (!config.tableName) return null;

  const response = await ddb.send(
    new GetItemCommand({
      TableName: config.tableName,
      Key: {
        [config.pkName]: { S: `${alertConfig.heartbeatPkPrefix}${ident}` },
        [config.skName]: { S: alertConfig.heartbeatSk }
      },
      ConsistentRead: true
    })
  );
  if (response.Item) {
    const item = unmarshall(response.Item);
    if (typeof item.lastSeenAt === 'string') return { ident, lastSeenAt: item.lastSeenAt };
  }

  // Safe rollout fallback: until the AWS ingest Lambda writes the dedicated
  // heartbeat, inspect only the recent threshold window for a complete K.T1
  // frame. Other MI value groups and events cannot mask an outage.
  return fetchRecentMeasurement(ident, lookbackMinutes);
};

import { QueryCommand, type AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { alertConfig, config, ddb, normalizeRecord } from './_shared';

export type HmiHeartbeat = {
  ident: string;
  lastSeenAt: string;
};

const fetchRecentMeasurement = async (ident: string, lookbackMinutes: number): Promise<HmiHeartbeat | null> => {
  const now = new Date();
  const queryMinutes = lookbackMinutes + alertConfig.sourceLagAllowanceMinutes;
  const start = new Date(now.getTime() - queryMinutes * 60_000).toISOString();
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
      const normalized = normalizeRecord(unmarshall(item)) as (Record<string, unknown> & { timestamp?: unknown }) | null;
      const timestamp = normalized && typeof normalized.timestamp === 'string' ? normalized.timestamp : null;
      const expiresAt = normalized && typeof normalized.expiresAt === 'number' ? normalized.expiresAt : null;
      if (expiresAt != null && Number.isFinite(alertConfig.valueRetentionDays)) {
        const inferredIngestTime = (expiresAt - alertConfig.valueRetentionDays * 86_400) * 1000;
        if (Number.isFinite(inferredIngestTime)) {
          return { ident, lastSeenAt: new Date(inferredIngestTime).toISOString() };
        }
      }
      if (timestamp) return { ident, lastSeenAt: timestamp };
    }
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return null;
};

export const fetchHmiHeartbeat = async (ident: string, lookbackMinutes = alertConfig.thresholdMinutes): Promise<HmiHeartbeat | null> => {
  if (!config.tableName) return null;

  const response = await ddb.send(
    new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: '#pk = :pk AND #sk = :sk',
      ExpressionAttributeNames: {
        '#pk': config.pkName,
        '#sk': config.skName
      },
      ExpressionAttributeValues: {
        ':pk': { S: `${alertConfig.heartbeatPkPrefix}${ident}` },
        ':sk': { S: alertConfig.heartbeatSk }
      },
      ConsistentRead: true,
      Limit: 1
    })
  );
  if (response.Items?.[0]) {
    const item = unmarshall(response.Items[0]);
    if (typeof item.lastSeenAt === 'string') return { ident, lastSeenAt: item.lastSeenAt };
  }

  // Safe rollout fallback: until the AWS ingest Lambda writes the dedicated
  // heartbeat, inspect recent complete K.T1 frames. Their source timestamp can
  // lag behind packet arrival, so infer the actual AWS ingest time from the TTL.
  // Other MI value groups and events cannot mask an outage.
  return fetchRecentMeasurement(ident, lookbackMinutes);
};

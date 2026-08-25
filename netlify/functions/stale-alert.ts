import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import nodemailer from 'nodemailer';
import { formatStaleDuration, isMissingOrStale, minutesSince } from '../../src/lib/staleness';
import { fetchHmiHeartbeat } from './_heartbeat';
import { alertConfig, config as sharedConfig, ddb, json, validateIdent } from './_shared';

export const config = {
  schedule: '*/15 * * * *'
};

const buildStateKey = (ident: string) => ({
  [sharedConfig.pkName]: { S: `${alertConfig.alertStatePkPrefix}${ident}` },
  [sharedConfig.skName]: { S: alertConfig.alertStateSk }
});

const buildEmailBody = (ident: string, latestTimestamp: string | null, thresholdMinutes: number) => {
  const ageMinutes = minutesSince(latestTimestamp);
  return [
    `MiniReactor Alarm für ${ident}`,
    '',
    latestTimestamp
      ? `Das HMI hat seit ${formatStaleDuration(latestTimestamp)} keinen vollständigen ${ident}-Messdatensatz geliefert.`
      : `Für das HMI wurde noch kein vollständiger ${ident}-Messdatensatz registriert.`,
    `Schwellwert: ${thresholdMinutes} Minuten`,
    `Letzter vollständiger Messdatensatz: ${latestTimestamp ?? 'unbekannt'}`,
    ...(ageMinutes == null ? [] : [`Aktuelles Alter: ${ageMinutes.toFixed(1)} Minuten`]),
    '',
    'Bitte HMI, Flespi und die AWS-Ingest-Pipeline prüfen.'
  ].join('\n');
};

export const handler = async () => {
  try {
    if (!sharedConfig.tableName) {
      return json(500, { ok: false, sent: false, message: 'DDB_TABLE is not configured' });
    }

    if (!alertConfig.enabled) {
      return json(200, { ok: true, sent: false, skipped: true, message: 'Stale alerting is disabled' });
    }

    if (!Number.isFinite(alertConfig.thresholdMinutes) || alertConfig.thresholdMinutes <= 0) {
      return json(500, { ok: false, sent: false, message: 'Stale alert threshold is invalid' });
    }

    const ident = validateIdent('MI');
    const heartbeat = await fetchHmiHeartbeat(ident, alertConfig.thresholdMinutes);
    const latestTimestamp = heartbeat?.lastSeenAt ?? null;

    if (!isMissingOrStale(latestTimestamp, alertConfig.thresholdMinutes)) {
      return json(200, { ok: true, sent: false, stale: false, timestamp: latestTimestamp });
    }

    if (!alertConfig.smtpUser || !alertConfig.smtpPass || !alertConfig.recipient) {
      return json(500, { ok: false, sent: false, message: 'SMTP alert configuration is incomplete' });
    }

    const state = await ddb.send(
      new GetItemCommand({
        TableName: sharedConfig.tableName,
        Key: buildStateKey(ident),
        ConsistentRead: true
      })
    );
    const existingState = state.Item ? unmarshall(state.Item) : null;
    const alertToken = latestTimestamp ?? 'NO_HEARTBEAT';
    if (typeof existingState?.lastAlertedTimestamp === 'string' && existingState.lastAlertedTimestamp === alertToken) {
      return json(200, { ok: true, sent: false, stale: true, alreadyNotified: true, timestamp: latestTimestamp });
    }

    const transporter = nodemailer.createTransport({
      host: alertConfig.smtpHost,
      port: alertConfig.smtpPort,
      secure: alertConfig.smtpSecure,
      auth: {
        user: alertConfig.smtpUser,
        pass: alertConfig.smtpPass
      }
    });

    const fromAddress = alertConfig.smtpFrom || alertConfig.smtpUser;
    await transporter.sendMail({
      from: fromAddress,
      to: alertConfig.recipient,
      subject: `[MiniReactor] Datenstopp ${ident}`,
      text: buildEmailBody(ident, latestTimestamp, alertConfig.thresholdMinutes)
    });

    await ddb.send(
      new PutItemCommand({
        TableName: sharedConfig.tableName,
        Item: {
          ...buildStateKey(ident),
          ident: { S: ident },
          lastAlertedTimestamp: { S: alertToken },
          lastAlertedAt: { S: new Date().toISOString() },
          thresholdMinutes: { N: String(alertConfig.thresholdMinutes) }
        }
      })
    );

    return json(200, { ok: true, sent: true, stale: true, timestamp: latestTimestamp });
  } catch (error) {
    return json(500, { ok: false, sent: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

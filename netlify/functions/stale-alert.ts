import { GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import nodemailer from 'nodemailer';
import { alertConfig, config as sharedConfig, ddb, json, validateIdent } from './_shared';
import { fetchLatestRecord } from './_latest';
import { formatStaleDuration, isStale, minutesSince } from '../../src/lib/staleness';

export const config = {
  schedule: '@hourly'
};

const buildStateKey = (ident: string) => ({
  [sharedConfig.pkName]: { S: `${alertConfig.alertStatePkPrefix}${ident}` },
  [sharedConfig.skName]: { S: alertConfig.alertStateSk }
});

const buildEmailBody = (ident: string, latestTimestamp: string, thresholdMinutes: number) => {
  const ageMinutes = minutesSince(latestTimestamp) ?? 0;
  return [
    `MiniReactor Alarm für ${ident}`,
    '',
    `Die Daten wurden seit ${formatStaleDuration(latestTimestamp)} nicht aktualisiert.`,
    `Schwellwert: ${thresholdMinutes} Minuten`,
    `Letzter Datenpunkt: ${latestTimestamp}`,
    `Aktuelles Alter: ${ageMinutes.toFixed(1)} Minuten`,
    '',
    'Bitte die AWS-Datenquelle und die Anbindung prüfen.'
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

    const ident = validateIdent('MI');
    const latest = await fetchLatestRecord(ident);
    if (!latest || !latest.timestamp) {
      return json(200, { ok: true, sent: false, message: 'No latest record available' });
    }

    if (!isStale(latest.timestamp, alertConfig.thresholdMinutes)) {
      return json(200, { ok: true, sent: false, stale: false, timestamp: latest.timestamp });
    }

    if (!alertConfig.smtpUser || !alertConfig.smtpPass || !alertConfig.recipient) {
      return json(500, { ok: false, sent: false, message: 'SMTP alert configuration is incomplete' });
    }

    const state = await ddb.send(
      new GetItemCommand({
        TableName: sharedConfig.tableName,
        Key: buildStateKey(ident)
      })
    );
    const existingState = state.Item ? unmarshall(state.Item) : null;
    if (typeof existingState?.lastAlertedTimestamp === 'string' && existingState.lastAlertedTimestamp === latest.timestamp) {
      return json(200, { ok: true, sent: false, stale: true, alreadyNotified: true, timestamp: latest.timestamp });
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
      text: buildEmailBody(ident, latest.timestamp, alertConfig.thresholdMinutes)
    });

    await ddb.send(
      new PutItemCommand({
        TableName: sharedConfig.tableName,
        Item: {
          ...buildStateKey(ident),
          ident: { S: ident },
          lastAlertedTimestamp: { S: latest.timestamp },
          lastAlertedAt: { S: new Date().toISOString() },
          thresholdMinutes: { N: String(alertConfig.thresholdMinutes) }
        }
      })
    );

    return json(200, { ok: true, sent: true, stale: true, timestamp: latest.timestamp });
  } catch (error) {
    return json(500, { ok: false, sent: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

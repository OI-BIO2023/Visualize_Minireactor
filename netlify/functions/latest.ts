import { config, json, parseQuery, validateIdent } from './_shared';
import { fetchLatestRecord } from './_latest';

export const handler = async (event: { queryStringParameters?: Record<string, string | undefined> }) => {
  try {
    const ident = validateIdent(parseQuery(event, 'ident') ?? 'MI');
    if (!config.tableName) return json(500, { ok: false, message: 'DDB_TABLE is not configured' });

    const latest = await fetchLatestRecord(ident);
    if (latest) {
      return json(
        200,
        {
          ok: true,
          item: latest.item,
          timestamp: latest.timestamp,
          flags: [],
          source: latest.source
        },
        {
          'Cache-Control': `public, max-age=${Math.max(5, config.cacheTtlSeconds)}`
        }
      );
    }

    return json(404, { ok: false, item: null, timestamp: null, flags: [], message: 'No valid latest record found' }, { 'Cache-Control': 'public, max-age=5' });
  } catch (error) {
    return json(400, { ok: false, message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

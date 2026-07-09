import batches from '../../data/reactor_batches.json';
import { json } from './_shared';

export const handler = async () =>
  json(200, { ok: true, batches }, { 'Cache-Control': 'public, max-age=300' });

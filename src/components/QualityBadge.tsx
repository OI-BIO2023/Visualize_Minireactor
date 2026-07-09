import type { QualityFlag } from '../lib/quality';

const labelMap: Record<QualityFlag, string> = {
  stale: 'veraltet',
  missing: 'fehlend',
  outOfRange: 'auÃŸerhalb Bereich',
  noBatch: 'kein Batch',
  ambiguousGasAssignment: 'Gas unklar'
};

export function QualityBadge({ flag }: { flag: QualityFlag }) {
  return <span className={`quality-badge quality-${flag}`}>{labelMap[flag]}</span>;
}

type Props = {
  batches: { batch_id: string; empty_at: string | null }[];
  selectedBatchId: string;
  onChange: (batchId: string) => void;
  onManualRangeChange: (range: { start: string; end: string }) => void;
  manualRange: { start: string; end: string };
};

export function PeriodSelector({ batches, selectedBatchId, onChange, onManualRangeChange, manualRange }: Props) {
  const toLocalInputValue = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const updateStart = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) onManualRangeChange({ ...manualRange, start: parsed.toISOString() });
  };

  const updateEnd = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) onManualRangeChange({ ...manualRange, end: parsed.toISOString() });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Periode wählen</h2>
          <p className="muted">Standard ist der Batch von Befüllung bis Entleerung.</p>
        </div>
      </div>
      <div className="selector-grid">
        <label>
          Batch
          <select value={selectedBatchId} onChange={(event) => onChange(event.target.value)}>
            {batches.map((batch) => (
              <option key={batch.batch_id} value={batch.batch_id}>
                {batch.batch_id} {batch.empty_at ? '' : '(laufend)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          Manueller Start
          <input type="datetime-local" value={toLocalInputValue(manualRange.start)} onChange={(event) => updateStart(event.target.value)} />
        </label>
        <label>
          Manuelles Ende
          <input type="datetime-local" value={toLocalInputValue(manualRange.end)} onChange={(event) => updateEnd(event.target.value)} />
        </label>
      </div>
    </section>
  );
}
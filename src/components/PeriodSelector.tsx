type Props = {
  range: { start: string; end: string };
  availableRange: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
};

const toLocalInputValue = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function PeriodSelector({ range, availableRange, onChange }: Props) {
  const updateStart = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) onChange({ ...range, start: parsed.toISOString() });
  };

  const updateEnd = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) onChange({ ...range, end: parsed.toISOString() });
  };

  const applyPreset = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    onChange({ start: start.toISOString(), end: end.toISOString() });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Zeitraum wählen</h2>
      </div>
      <div className="selector-grid selector-grid-wide">
        <label>
          Schnellwahl
          <div className="chip-row">
            <button type="button" className="filter-button" onClick={() => onChange(availableRange)}>
              Gesamter Zeitraum
            </button>
            <button type="button" className="filter-button" onClick={() => applyPreset(24)}>
              24h
            </button>
            <button type="button" className="filter-button" onClick={() => applyPreset(24 * 7)}>
              7 Tage
            </button>
          </div>
        </label>
        <label>
          Start
          <input type="datetime-local" value={toLocalInputValue(range.start)} onChange={(event) => updateStart(event.target.value)} />
        </label>
        <label>
          Ende
          <input type="datetime-local" value={toLocalInputValue(range.end)} onChange={(event) => updateEnd(event.target.value)} />
        </label>
      </div>
    </section>
  );
}

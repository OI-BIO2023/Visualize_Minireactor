import type { ReactorId } from '../config/reactors';

type Props = {
  reactor: ReactorId;
  values?: Partial<Record<string, unknown>> | null;
};

type LabelSpec = {
  key: string;
  x: number;
  y: number;
};

const labelMap: Record<string, string> = {
  topLeft: 'oben links',
  topRight: 'oben rechts',
  middle: 'Mitte',
  bottomLeft: 'unten links',
  bottomRight: 'unten rechts',
  inner: 'Innenraum'
};

const labelsByReactor = (reactor: ReactorId): LabelSpec[] => {
  return [
    { key: `T_oben_L_${reactor}`, x: 82, y: 54 },
    { key: `T_oben_R_${reactor}`, x: 238, y: 54 },
    { key: `T_Mittel_${reactor}`, x: 160, y: 92 },
    { key: `T_unter_L_${reactor}`, x: 82, y: 134 },
    { key: `T_unter_R_${reactor}`, x: 238, y: 134 },
    { key: `T_Innenraum_${reactor}`, x: 160, y: 162 }
  ];
};

const sensorLabel = (key: string, reactor: ReactorId) => {
  const suffix = `_${reactor}`;
  const lookup: Record<string, string> = {
    [`T_oben_L${suffix}`]: labelMap.topLeft,
    [`T_oben_R${suffix}`]: labelMap.topRight,
    [`T_Mittel${suffix}`]: labelMap.middle,
    [`T_unter_L${suffix}`]: labelMap.bottomLeft,
    [`T_unter_R${suffix}`]: labelMap.bottomRight,
    [`T_Innenraum${suffix}`]: labelMap.inner
  };
  return lookup[key] ?? key.replaceAll('_', ' ');
};

const formatValue = (value: unknown) => {
  if (value == null) return '–';
  if (typeof value === 'number') return `${value.toFixed(1)}°C`;
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
};

export function ReactorSchematic({ reactor, values }: Props) {
  const gradientId = `tank-${reactor}`;
  return (
    <svg viewBox="0 0 320 190" className="reactor-schematic" role="img" aria-label={`Schematische Darstellung ${reactor}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor="#0b1f2a" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id={`${gradientId}-core`} x1="0" x2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x="16" y="16" width="288" height="158" rx="28" fill="#07111f" stroke="rgba(148,163,184,0.18)" />
      <path d="M52 40h216c18 0 32 14 32 32v44c0 18-14 32-32 32H52c-18 0-32-14-32-32V72c0-18 14-32 32-32Z" fill={`url(#${gradientId})`} />
      <rect x="86" y="54" width="148" height="82" rx="20" fill={`url(#${gradientId}-core)`} opacity="0.92" />
      <circle cx="160" cy="95" r="35" fill="rgba(34,197,94,0.2)" />
      <path d="M160 58v74M123 95h74" stroke="#9be7ff" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 40c16 12 29 18 46 18h112c17 0 30-6 46-18" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="2" />
      {labelsByReactor(reactor).map((label) => {
        const value = formatValue(values?.[label.key]);
        return (
          <g key={label.key}>
            <rect x={label.x - 38} y={label.y - 22} width={76} height={24} rx="10" fill="rgba(2, 8, 23, 0.88)" stroke="rgba(56,189,248,0.22)" />
            <text x={label.x} y={label.y - 6} textAnchor="middle" fill="#94a3b8" fontSize="9">
              {sensorLabel(label.key, reactor)}
            </text>
            <text x={label.x} y={label.y + 7} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="700">
              {value}
            </text>
          </g>
        );
      })}
      <text x="160" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="28" fontWeight="700">
        {reactor}
      </text>
    </svg>
  );
}
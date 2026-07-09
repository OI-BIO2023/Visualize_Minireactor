import type { ReactorId } from '../config/reactors';
import { formatTemperatureValue } from '../lib/derived';

type Props = {
  reactor: ReactorId;
  values?: Partial<Record<string, unknown>> | null;
};

type LabelSpec = {
  key: string;
  x: number;
  y: number;
  anchor: 'left' | 'right' | 'center';
  tone: string;
};

const labelsByReactor = (reactor: ReactorId): LabelSpec[] => [
  { key: `T_oben_L_${reactor}`, x: 18, y: 40, anchor: 'left', tone: 'tone-blue' },
  { key: `T_oben_R_${reactor}`, x: 302, y: 40, anchor: 'right', tone: 'tone-cyan' },
  { key: `T_Mittel_${reactor}`, x: 160, y: 24, anchor: 'center', tone: 'tone-green' },
  { key: `T_unter_L_${reactor}`, x: 18, y: 152, anchor: 'left', tone: 'tone-amber' },
  { key: `T_unter_R_${reactor}`, x: 302, y: 152, anchor: 'right', tone: 'tone-violet' },
  { key: `T_Innenraum_${reactor}`, x: 160, y: 172, anchor: 'center', tone: 'tone-slate' }
];

const sensorLabel = (key: string, reactor: ReactorId) => {
  const suffix = `_${reactor}`;
  const lookup: Record<string, string> = {
    [`T_oben_L${suffix}`]: 'oben links',
    [`T_oben_R${suffix}`]: 'oben rechts',
    [`T_Mittel${suffix}`]: 'Mitte',
    [`T_unter_L${suffix}`]: 'unten links',
    [`T_unter_R${suffix}`]: 'unten rechts',
    [`T_Innenraum${suffix}`]: 'Innenraum'
  };
  return lookup[key] ?? key.replaceAll('_', ' ');
};

export function ReactorSchematic({ reactor, values }: Props) {
  const gradientId = `tank-${reactor}`;
  return (
    <svg viewBox="0 0 320 210" className="reactor-schematic" role="img" aria-label={`Schematische Darstellung ${reactor}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor="#08111b" />
          <stop offset="50%" stopColor="#12304a" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id={`${gradientId}-core`} x1="0" x2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="0 0 0 0 0.29 0 0 0 0 0.72 0 0 0 0 0.87 0 0 0 0.32 0"
          />
        </filter>
      </defs>
      <rect x="14" y="16" width="292" height="178" rx="28" fill="#07111f" stroke="rgba(148,163,184,0.18)" />
      <rect x="34" y="28" width="252" height="154" rx="24" fill={`url(#${gradientId})`} opacity="0.95" />
      <ellipse cx="160" cy="100" rx="86" ry="58" fill={`url(#${gradientId}-core)`} opacity="0.95" />
      <ellipse cx="160" cy="100" rx="104" ry="72" fill="rgba(56,189,248,0.08)" filter={`url(#${gradientId}-glow)`} />
      <ellipse cx="160" cy="100" rx="56" ry="38" fill="rgba(255,255,255,0.05)" stroke="rgba(226,232,240,0.16)" />
      <path d="M102 100h116M160 56v88" stroke="#9be7ff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <path d="M60 40c20 14 42 22 70 22h60c28 0 50-8 70-22" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="2" />
      {labelsByReactor(reactor).map((label) => {
        const raw = values?.[label.key];
        return (
          <g key={label.key}>
            <rect
              x={label.anchor === 'center' ? label.x - 50 : label.anchor === 'left' ? label.x : label.x - 100}
              y={label.y - 22}
              width={label.anchor === 'center' ? 100 : 92}
              height={40}
              rx="12"
              className={label.tone}
              fill="rgba(2, 8, 23, 0.9)"
              stroke="rgba(56,189,248,0.2)"
            />
            <text x={label.x} y={label.y - 5} textAnchor="middle" fill="#94a3b8" fontSize="9">
              {sensorLabel(label.key, reactor)}
            </text>
            <text x={label.x} y={label.y + 10} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
              {formatTemperatureValue(raw)}
            </text>
          </g>
        );
      })}
      <text x="160" y="204" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">
        {reactor}
      </text>
    </svg>
  );
}

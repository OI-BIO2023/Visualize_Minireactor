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
  side: 'top' | 'bottom' | 'left' | 'right';
};

const labelsByReactor = (reactor: ReactorId): LabelSpec[] => [
  { key: `T_oben_L_${reactor}`, x: 48, y: 28, anchor: 'left', side: 'top' },
  { key: `T_oben_R_${reactor}`, x: 272, y: 28, anchor: 'right', side: 'top' },
  { key: `T_Mittel_${reactor}`, x: 160, y: 22, anchor: 'center', side: 'top' },
  { key: `T_unter_L_${reactor}`, x: 48, y: 172, anchor: 'left', side: 'bottom' },
  { key: `T_unter_R_${reactor}`, x: 272, y: 172, anchor: 'right', side: 'bottom' },
  { key: `T_Innenraum_${reactor}`, x: 160, y: 184, anchor: 'center', side: 'bottom' }
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
          <stop offset="0%" stopColor="#07131d" />
          <stop offset="52%" stopColor="#12394c" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id={`${gradientId}-core`} x1="0" x2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.29 0 0 0 0 0.72 0 0 0 0 0.87 0 0 0 0.28 0" />
        </filter>
      </defs>
      <rect x="14" y="14" width="292" height="182" rx="28" fill="#07111f" stroke="rgba(148,163,184,0.18)" />
      <rect x="32" y="24" width="256" height="162" rx="26" fill={`url(#${gradientId})`} opacity="0.96" />
      <ellipse cx="160" cy="98" rx="92" ry="64" fill={`url(#${gradientId}-core)`} opacity="0.96" />
      <ellipse cx="160" cy="98" rx="114" ry="78" fill="rgba(44,168,157,0.08)" filter={`url(#${gradientId}-glow)`} />
      <ellipse cx="160" cy="98" rx="58" ry="40" fill="rgba(255,255,255,0.05)" stroke="rgba(226,232,240,0.16)" />
      <path d="M60 42c20 14 42 22 70 22h60c28 0 50-8 70-22" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="2" />
      <path d="M60 166c18-10 40-16 66-16h68c26 0 48 6 66 16" fill="none" stroke="rgba(56,189,248,0.18)" strokeWidth="2" />
      {labelsByReactor(reactor).map((label) => {
        const raw = values?.[label.key];
        return (
          <g key={label.key} className={`schematic-label label-${label.side}`}>
            {label.side === 'top' ? (
              <path d={`M${label.x} ${label.y + 6} L${label.x} 58`} stroke="rgba(125,211,252,0.32)" strokeWidth="1.5" fill="none" />
            ) : label.side === 'bottom' ? (
              <path d={`M${label.x} ${label.y - 8} L${label.x} 152`} stroke="rgba(125,211,252,0.32)" strokeWidth="1.5" fill="none" />
            ) : null}
            <text
              x={label.x}
              y={label.y}
              textAnchor={label.anchor === 'center' ? 'middle' : label.anchor === 'left' ? 'start' : 'end'}
              fill="#d6f5ff"
              fontSize="11"
              fontWeight="600"
            >
              {sensorLabel(label.key, reactor)}
            </text>
            <text
              x={label.x}
              y={label.y + 16}
              textAnchor={label.anchor === 'center' ? 'middle' : label.anchor === 'left' ? 'start' : 'end'}
              fill="#ffffff"
              fontSize="13"
              fontWeight="800"
            >
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
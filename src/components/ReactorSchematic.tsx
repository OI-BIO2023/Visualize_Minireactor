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
  side: 'top' | 'bottom';
};

const labelsByReactor = (reactor: ReactorId): LabelSpec[] => [
  { key: `T_oben_L_${reactor}`, x: 50, y: 34, anchor: 'left', side: 'top' },
  { key: `T_oben_R_${reactor}`, x: 270, y: 34, anchor: 'right', side: 'top' },
  { key: `T_Mittel_${reactor}`, x: 160, y: 93, anchor: 'center', side: 'top' },
  { key: `T_Innenraum_${reactor}`, x: 160, y: 130, anchor: 'center', side: 'bottom' },
  { key: `T_unter_L_${reactor}`, x: 50, y: 166, anchor: 'left', side: 'bottom' },
  { key: `T_unter_R_${reactor}`, x: 270, y: 166, anchor: 'right', side: 'bottom' }
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
          <stop offset="0%" stopColor="#08131a" />
          <stop offset="44%" stopColor="#24445a" />
          <stop offset="100%" stopColor="#6b3f17" />
        </linearGradient>
        <linearGradient id={`${gradientId}-core`} x1="0" x2="1">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="55%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.96 0 0 0 0 0.53 0 0 0 0 0.12 0 0 0 0.34 0" />
        </filter>
      </defs>
      <rect x="14" y="14" width="292" height="182" rx="28" fill="#07111f" stroke="rgba(148,163,184,0.18)" />
      <rect x="32" y="24" width="256" height="162" rx="26" fill={`url(#${gradientId})`} opacity="0.96" />
      <ellipse cx="160" cy="98" rx="92" ry="64" fill={`url(#${gradientId}-core)`} opacity="0.98" />
      <ellipse cx="160" cy="98" rx="114" ry="78" fill="rgba(245,158,11,0.10)" filter={`url(#${gradientId}-glow)`} />
      <ellipse cx="160" cy="98" rx="58" ry="40" fill="rgba(255,255,255,0.05)" stroke="rgba(226,232,240,0.16)" />
      <path d="M60 42c20 14 42 22 70 22h60c28 0 50-8 70-22" fill="none" stroke="rgba(253,224,71,0.28)" strokeWidth="2" />
      <path d="M60 166c18-10 40-16 66-16h68c26 0 48 6 66 16" fill="none" stroke="rgba(251,146,60,0.20)" strokeWidth="2" />
      {labelsByReactor(reactor).map((label) => {
        const raw = values?.[label.key];
        return (
          <g key={label.key} className={`schematic-label label-${label.side}`}>
            {label.side === 'top' ? <path d={`M${label.x} ${label.y + 6} L${label.x} 58`} stroke="rgba(253,224,71,0.34)" strokeWidth="1.5" fill="none" /> : null}
            {label.side === 'bottom' ? <path d={`M${label.x} ${label.y - 8} L${label.x} 148`} stroke="rgba(251,146,60,0.32)" strokeWidth="1.5" fill="none" /> : null}
            <text
              x={label.x}
              y={label.y}
              textAnchor={label.anchor === 'center' ? 'middle' : label.anchor === 'left' ? 'start' : 'end'}
              fill="#fff7ed"
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
    </svg>
  );
}
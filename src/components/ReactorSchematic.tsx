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
};

const labelsByReactor = (reactor: ReactorId): LabelSpec[] => [
  { key: `T_oben_L_${reactor}`, x: 52, y: 36 },
  { key: `T_oben_R_${reactor}`, x: 268, y: 36 },
  { key: `T_Mittel_${reactor}`, x: 160, y: 96 },
  { key: `T_Innenraum_${reactor}`, x: 290, y: 128 },
  { key: `T_unter_L_${reactor}`, x: 52, y: 164 },
  { key: `T_unter_R_${reactor}`, x: 268, y: 164 }
];

export function ReactorSchematic({ reactor, values }: Props) {
  const gradientId = `tank-${reactor}`;

  return (
    <svg viewBox="0 0 320 210" className="reactor-schematic" role="img" aria-label={`Schematische Darstellung ${reactor}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor="#09141a" />
          <stop offset="42%" stopColor="#173449" />
          <stop offset="100%" stopColor="#7f341a" />
        </linearGradient>
        <linearGradient id={`${gradientId}-core`} x1="0" x2="1">
          <stop offset="0%" stopColor="#8b1f18" />
          <stop offset="55%" stopColor="#d94818" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.94 0 0 0 0 0.38 0 0 0 0 0.16 0 0 0 0.3 0" />
        </filter>
      </defs>
      <rect x="14" y="14" width="292" height="182" rx="28" fill="#07111f" stroke="rgba(148,163,184,0.18)" />
      <rect x="32" y="24" width="256" height="162" rx="26" fill={`url(#${gradientId})`} opacity="0.96" />
      <ellipse cx="160" cy="98" rx="94" ry="66" fill={`url(#${gradientId}-core)`} opacity="0.98" />
      <ellipse cx="160" cy="98" rx="118" ry="80" fill="rgba(251,191,36,0.11)" filter={`url(#${gradientId}-glow)`} />
      <ellipse cx="160" cy="98" rx="70" ry="46" fill="rgba(255,255,255,0.04)" stroke="rgba(226,232,240,0.16)" />
      <path d="M60 42c20 14 42 22 70 22h60c28 0 50-8 70-22" fill="none" stroke="rgba(248,180,0,0.20)" strokeWidth="2" />
      <path d="M60 166c18-10 40-16 66-16h68c26 0 48 6 66 16" fill="none" stroke="rgba(248,113,113,0.20)" strokeWidth="2" />
      {labelsByReactor(reactor).map((label) => {
        const raw = values?.[label.key];
        return (
          <g key={label.key}>
            <text
              x={label.x}
              y={label.y}
              textAnchor={label.x > 200 ? 'end' : label.x < 80 ? 'start' : 'middle'}
              fill="#ffffff"
              fontSize="13"
              fontWeight="800"
              opacity="0.98"
            >
              {formatTemperatureValue(raw)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

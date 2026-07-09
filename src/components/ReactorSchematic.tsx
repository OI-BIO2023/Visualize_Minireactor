import type { ReactorId } from '../config/reactors';

export function ReactorSchematic({ reactor }: { reactor: ReactorId }) {
  const gradientId = `tank-${reactor}`;
  return (
    <svg viewBox="0 0 320 180" className="reactor-schematic" role="img" aria-label={`Schematische Darstellung ${reactor}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor="#083344" />
          <stop offset="100%" stopColor="#155e75" />
        </linearGradient>
      </defs>
      <rect x="22" y="18" width="276" height="144" rx="24" fill={`url(#${gradientId})`} opacity="0.12" />
      <rect x="46" y="34" width="228" height="112" rx="22" fill={`url(#${gradientId})`} />
      <path
        d="M92 34h136c18 0 26 10 26 26v60c0 18-8 26-26 26H92c-18 0-26-8-26-26V60c0-16 8-26 26-26Z"
        fill="#0f172a"
        stroke="#38bdf8"
        strokeOpacity="0.4"
        strokeWidth="2"
      />
      <circle cx="160" cy="90" r="34" fill="#22c55e" opacity="0.25" />
      <path d="M160 56v68M126 90h68" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
      <text x="160" y="150" textAnchor="middle" fill="#e2e8f0" fontSize="28" fontWeight="700">
        {reactor}
      </text>
    </svg>
  );
}

interface ServiceAreaMapProps {
  /** Tailwind classes applied to the <svg> element. */
  className?: string;
}

/**
 * Stylized map marking the two counties Alta serves.
 *
 * Decorative — the county and city names are listed as real text alongside it,
 * so the caller marks the surrounding container `aria-hidden`.
 */
export function ServiceAreaMap({ className }: ServiceAreaMapProps) {
  return (
    <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M80 40H320V360H200V280H80V40Z" fill="#F0F4F8" stroke="#E5E7EB" strokeWidth="2" />
      <rect x="140" y="60" width="80" height="50" rx="4" fill="#003087" opacity="0.2" stroke="#003087" strokeWidth="2" />
      <text x="180" y="90" textAnchor="middle" className="text-xs font-semibold" fill="#003087">Weber</text>
      <rect x="140" y="110" width="80" height="50" rx="4" fill="#00A86B" opacity="0.2" stroke="#00A86B" strokeWidth="2" />
      <text x="180" y="140" textAnchor="middle" className="text-xs font-semibold" fill="#00A86B">Davis</text>
      <circle cx="160" cy="80" r="4" fill="#003087" />
      <circle cx="170" cy="130" r="4" fill="#00A86B" />
      <circle cx="190" cy="75" r="4" fill="#003087" />
    </svg>
  );
}

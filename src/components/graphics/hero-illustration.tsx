interface HeroIllustrationProps {
  /** Tailwind classes applied to the <svg> element. */
  className?: string;
}

/**
 * Decorative mountain-and-house scene shown beside the homepage headline.
 *
 * Purely ornamental — the caller is expected to mark the surrounding container
 * `aria-hidden`, since nothing here conveys information the copy doesn't.
 *
 * Note: the gradient ids below are document-global, so rendering this more than
 * once on a page would make the duplicates reuse the first instance's fills.
 */
export function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <svg width="520" height="400" viewBox="0 0 520 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FBF6EC" />
          <stop offset="60%" stopColor="#FDF9F1" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
        <radialGradient id="sunGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#E4C87E" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#E4C87E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E4C87E" />
          <stop offset="100%" stopColor="#C89B3C" />
        </linearGradient>
        <linearGradient id="mtnFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a9e" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#1a4a9e" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="mtnNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#003087" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#001f5c" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00c77b" />
          <stop offset="100%" stopColor="#00A86B" />
        </linearGradient>
      </defs>

      <rect width="520" height="400" fill="url(#skyGrad)" rx="24" />

      {/* Warm sun with glow */}
      <g className="animate-float">
        <circle cx="400" cy="95" r="90" fill="url(#sunGlow)" />
        <circle cx="400" cy="95" r="38" fill="url(#sunGrad)" />
      </g>

      {/* Distant mountain range */}
      <path d="M0 260L70 160L130 200L190 110L260 190L330 100L400 180L460 130L520 200V400H0Z" fill="url(#mtnFar)" />

      {/* Near mountain range */}
      <path d="M0 400L90 230L170 280L250 150L340 260L430 190L520 260V400H0Z" fill="url(#mtnNear)" />

      {/* Snow caps */}
      <path d="M240 158L250 150L262 166L250 160L238 172Z" fill="white" opacity="0.9" />
      <path d="M420 200L430 190L444 206L430 198L416 212Z" fill="white" opacity="0.9" />

      {/* House with warm-lit windows */}
      <g transform="translate(150 268)">
        <rect x="-46" y="34" width="92" height="62" rx="4" fill="white" />
        <path d="M-58 40L0 -18L58 40L44 40L0 -2L-44 40Z" fill="url(#roofGrad)" />
        <rect x="-14" y="60" width="28" height="36" rx="2" fill="#003087" opacity="0.85" />
        <rect x="-34" y="46" width="18" height="18" rx="2" fill="#E4C87E" opacity="0.75" />
        <rect x="16" y="46" width="18" height="18" rx="2" fill="#E4C87E" opacity="0.75" />
      </g>
    </svg>
  );
}

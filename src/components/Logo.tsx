/**
 * Beach Performance / Trackside mark — a double-chevron "fast-forward" motion mark.
 * Uses currentColor so it can be tinted gold, white, or black by its parent.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points="44,18 78,50 44,82"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <line x1="16" y1="74" x2="46" y2="48" stroke="currentColor" strokeWidth="15" strokeLinecap="butt" />
    </svg>
  );
}

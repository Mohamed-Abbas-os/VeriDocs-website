export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="8" fill="#0f141c" stroke="rgba(148,163,184,0.25)" />
      <path d="M10 6h8l5 5v14a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" fill="none" stroke="#3fd4ff" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M18 6v5h5" fill="none" stroke="#3fd4ff" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6 19h20" stroke="#5b8cff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

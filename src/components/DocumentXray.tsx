const CALLOUTS = [
  { y: 56, title: 'Metadata', detail: 'producer, dates', flag: false },
  { y: 128, title: 'Structure', detail: 'revisions, objects', flag: false },
  { y: 200, title: 'Fonts', detail: 'subsets, embedding', flag: true },
  { y: 272, title: 'Images', detail: 'codecs, coverage', flag: false },
  { y: 336, title: 'Actions', detail: 'scripts, launch', flag: false },
];

/** Illustration of a PDF page under inspection. Not a real result. */
export function DocumentXray() {
  return (
    <figure className="mx-auto w-full max-w-[520px]">
      <svg
        viewBox="0 0 520 380"
        role="img"
        aria-label="Illustration of a PDF page being inspected for metadata, structure, font, image and action signals. One text line is highlighted as an example anomaly."
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="beamGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#3fd4ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#3fd4ff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#3fd4ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3fd4ff" stopOpacity="0" />
            <stop offset="1" stopColor="#3fd4ff" stopOpacity="0.18" />
          </linearGradient>
          <clipPath id="pageClip">
            <rect x="30" y="20" width="250" height="330" rx="6" />
          </clipPath>
        </defs>

        <rect x="30" y="20" width="250" height="330" rx="6" fill="rgba(255,255,255,0.035)" stroke="rgba(148,163,184,0.4)" />
        <g clipPath="url(#pageClip)">
          <rect x="52" y="44" width="120" height="10" rx="2" fill="rgba(226,232,240,0.55)" />
          {[70, 84, 98, 112].map((y, i) => (
            <rect key={y} x="52" y={y} width={[190, 176, 196, 120][i]} height="5" rx="2" fill="rgba(148,163,184,0.3)" />
          ))}
          <rect x="52" y="134" width="196" height="64" rx="3" fill="rgba(91,140,255,0.12)" stroke="rgba(91,140,255,0.35)" />
          <path d="M52 198l50-34 34 22 30-18 82 30" fill="none" stroke="rgba(91,140,255,0.4)" />
          {[214, 228].map((y, i) => (
            <rect key={y} x="52" y={y} width={[196, 150][i]} height="5" rx="2" fill="rgba(148,163,184,0.3)" />
          ))}
          <rect x="50" y="240" width="200" height="9" rx="2" fill="rgba(245,158,11,0.28)" stroke="rgba(245,158,11,0.9)" strokeDasharray="4 3" />
          {[262, 276].map((y, i) => (
            <rect key={y} x="52" y={y} width={[188, 160][i]} height="5" rx="2" fill="rgba(148,163,184,0.3)" />
          ))}
          <path d="M56 322c14-16 22 8 34-6s16-8 26 2 18-14 30-2" fill="none" stroke="rgba(226,232,240,0.55)" strokeWidth="1.6" strokeLinecap="round" />
          <g className="xray-beam">
            <rect x="30" y="20" width="250" height="26" fill="url(#beamGlow)" />
            <rect x="30" y="44" width="250" height="2" fill="url(#beamGrad)" />
          </g>
        </g>

        {CALLOUTS.map((c) => {
          const stroke = c.flag ? '#f59e0b' : 'rgba(63,212,255,0.65)';
          return (
            <g key={c.title}>
              <path d={`M280 ${c.y} H330`} stroke={stroke} strokeWidth="1" />
              <circle cx="280" cy={c.y} r="3.5" fill={stroke} />
              <rect x="330" y={c.y - 24} width="170" height="48" rx="8" fill="rgba(15,20,28,0.9)" stroke={c.flag ? 'rgba(245,158,11,0.6)' : 'rgba(148,163,184,0.25)'} />
              <text x="346" y={c.y - 3} className="fill-slate-100 text-[13px] font-semibold">
                {c.title}
              </text>
              <text x="346" y={c.y + 14} className="fill-slate-400 font-mono text-[11px]">
                {c.detail}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-slate-500">Illustration only. Not a real analysis result.</figcaption>
    </figure>
  );
}

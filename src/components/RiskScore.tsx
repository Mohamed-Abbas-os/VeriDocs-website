import { useEffect, useState } from 'react';
import { SCORE_CAPTION } from '../config';
import type { RiskLevel } from '../types/forensics';
import { RISK_STYLES, RiskBadge } from './RiskBadge';

interface Props {
  score: number;
  level: RiskLevel;
}

const R = 84;
const C = 2 * Math.PI * R;

export function RiskScore({ score, level }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setShown(score));
    return () => window.cancelAnimationFrame(id);
  }, [score]);
  const stroke = RISK_STYLES[level].stroke;

  return (
    <div className="flex flex-col items-center text-center">
      <h3 className="text-sm font-semibold tracking-[0.14em] text-slate-300">FORENSIC RISK SCORE</h3>
      <div className="relative mt-4 h-52 w-52" role="img" aria-label={`Forensic risk score ${score} out of 100, ${RISK_STYLES[level].label.toLowerCase()}`}>
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="12" />
          <circle
            className="ring-progress"
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - shown / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-5xl font-bold text-white">
            {score}
            <span className="ml-1 text-xl font-medium text-slate-400">/ 100</span>
          </p>
        </div>
      </div>
      <div className="mt-4">
        <RiskBadge level={level} />
      </div>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">{SCORE_CAPTION}</p>
    </div>
  );
}

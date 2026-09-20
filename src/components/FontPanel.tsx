import { Type } from 'lucide-react';
import type { FontInfo } from '../types/forensics';
import { NOT_AVAILABLE } from '../types/forensics';
import { formatNumber } from '../utils/format';
import { Panel } from './Panel';

export function FontPanel({ fonts }: { fonts: FontInfo }) {
  return (
    <Panel title="Font analysis" icon={<Type size={18} className="text-signal" aria-hidden="true" />}>
      {fonts.status === 'UNAVAILABLE' ? (
        <p className="text-sm italic text-slate-500">{NOT_AVAILABLE}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-300">
            {fonts.count} font(s) in {fonts.familyCount} famil{fonts.familyCount === 1 ? 'y' : 'ies'}
            {fonts.status === 'PARTIAL' && <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-xs text-amber-200">Browser-limited analysis</span>}
          </p>
          {fonts.fonts.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <caption className="sr-only">Fonts detected in the document</caption>
                <thead>
                  <tr className="border-b border-slate-700/50 text-xs text-slate-400">
                    <th scope="col" className="py-2 pr-3 font-medium">Font</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Embedded</th>
                    <th scope="col" className="py-2 text-right font-medium">Characters</th>
                  </tr>
                </thead>
                <tbody>
                  {fonts.fonts.map((f) => (
                    <tr key={f.name} className="border-b border-slate-700/25 last:border-0">
                      <td className="py-2 pr-3 font-mono text-[13px] text-slate-200 [overflow-wrap:anywhere]">{f.name}</td>
                      <td className="py-2 pr-3 text-slate-400">{f.type ?? 'Unknown'}</td>
                      <td className="py-2 pr-3 text-slate-400">{f.embedded === null ? 'Unknown' : f.embedded ? 'Yes' : 'No'}</td>
                      <td className="py-2 text-right text-slate-400">{formatNumber(f.characters)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {fonts.notes.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {fonts.notes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}

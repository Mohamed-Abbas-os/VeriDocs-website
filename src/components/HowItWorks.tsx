import { Braces, Image as ImageIcon, LayoutTemplate, Layers, Tags, Type, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SIGNALS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Tags, title: 'Metadata', text: 'Compares creator, producer and dates in the Info dictionary and XMP, and looks for impossible or inconsistent timelines.' },
  { icon: Layers, title: 'Structure', text: 'Counts revisions and redefined objects, and checks whether data follows a signature or the end of the file.' },
  { icon: Type, title: 'Fonts', text: 'Looks for the same font embedded as several subsets and for fonts used on only a few characters.' },
  { icon: ImageIcon, title: 'Images', text: 'Finds image-only pages and mixed compression. It does not analyze image pixels.' },
  { icon: Zap, title: 'Actions', text: 'Flags scripts, launch and submit actions, attachments, and action names hidden with character escapes.' },
  { icon: LayoutTemplate, title: 'Layout', text: 'Notes overlay annotations, mixed page sizes and full-page images that sit under a text layer.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h2 id="how-title" className="text-2xl font-bold text-white sm:text-3xl">
        How VeriDocs reaches a score
      </h2>
      <p className="mt-2 max-w-2xl text-slate-400">
        Every point in the score comes from a signal that was actually detected in your file. Each finding shows the evidence, and the score breakdown adds them up so nothing is hidden.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIGNALS.map((s) => (
          <div key={s.title} className="panel p-5">
            <s.icon size={20} className="text-signal" aria-hidden="true" />
            <h3 className="mt-3 font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="panel mt-6 grid gap-6 p-6 md:grid-cols-2">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Braces size={18} className="text-signal" aria-hidden="true" />
            Scoring bands
          </h3>
          <table className="mt-3 w-full text-left text-sm">
            <caption className="sr-only">Risk level for each score range</caption>
            <tbody>
              {[
                ['0 to 25', 'Low'],
                ['26 to 50', 'Moderate'],
                ['51 to 75', 'High'],
                ['76 to 100', 'Critical'],
              ].map(([range, name]) => (
                <tr key={range} className="border-b border-slate-700/30 last:border-0">
                  <th scope="row" className="py-2 pr-4 font-mono text-[13px] font-normal text-slate-300">
                    {range}
                  </th>
                  <td className="py-2 text-slate-400">{name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-semibold text-white">What browser-based means here</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The file is read into memory, scanned by VeriDocs code and parsed by pdf.js in a Web Worker. Nothing is sent anywhere. Some checks only see uncompressed parts of the file, and those are labeled Browser-limited analysis. Checks that a browser cannot do, such as signature validation, are listed as not available instead of being guessed.
          </p>
        </div>
      </div>
    </section>
  );
}

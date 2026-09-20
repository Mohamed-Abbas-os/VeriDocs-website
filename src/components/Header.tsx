import { Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { APP_NAME, REPO_URL } from '../config';
import { Logo } from './Logo';

interface Props {
  onNavigate: (id: 'analyze' | 'how-it-works' | 'about') => void;
  onHome: () => void;
}

const LINKS: { id: 'analyze' | 'how-it-works' | 'about'; label: string }[] = [
  { id: 'analyze', label: 'Document Forensics' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'about', label: 'About' },
];

export function Header({ onNavigate, onHome }: Props) {
  const [open, setOpen] = useState(false);

  const go = (id: 'analyze' | 'how-it-works' | 'about') => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/40 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={onHome} className="flex items-center gap-2.5 rounded-lg" aria-label={`${APP_NAME} home`}>
          <Logo />
          <span className="text-lg font-bold tracking-wide text-white">{APP_NAME}</span>
        </button>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(l.id);
              }}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-2 rounded-lg border border-slate-600/60 px-3 py-2 text-sm text-slate-100 transition-colors hover:border-signal/60 hover:bg-white/5"
            aria-label="View source on GitHub (opens in a new tab)"
          >
            <Github size={16} aria-hidden="true" />
            GitHub
          </a>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-200 hover:bg-white/5 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-slate-700/40 bg-ink-900 px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.id);
                  }}
                  className="block rounded-lg px-3 py-2.5 text-slate-200 hover:bg-white/5"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-200 hover:bg-white/5"
              >
                <Github size={16} aria-hidden="true" />
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

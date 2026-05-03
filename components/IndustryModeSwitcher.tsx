'use client';
import { useTransition } from 'react';
import { FlaskConical, Pill, Zap } from 'lucide-react';
import { updateIndustryMode } from '@/app/actions/mode';
import type { IndustryMode } from '@/lib/commodities';

const MODES: Array<{
  id: IndustryMode;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}> = [
  { id: 'specialty-chem',  label: 'Specialty Chemicals', shortLabel: 'Spec. Chem', icon: FlaskConical },
  { id: 'life-sciences',   label: 'Life Sciences',       shortLabel: 'Life Sci',   icon: Pill },
  { id: 'energy',          label: 'Energy & Feedstocks', shortLabel: 'Energy',     icon: Zap },
];

interface Props {
  currentMode: IndustryMode;
}

export default function IndustryModeSwitcher({ currentMode }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleModeChange(mode: IndustryMode) {
    if (mode === currentMode || isPending) return;
    startTransition(async () => {
      await updateIndustryMode(mode);
    });
  }

  return (
    <div
      className="no-print shrink-0 px-4 lg:px-6 py-2 border-b flex items-center gap-3"
      style={{ backgroundColor: 'var(--card-2)', borderColor: 'var(--border)' }}
    >
      <span
        className="text-[10px] font-bold uppercase tracking-wider shrink-0 hidden sm:block"
        style={{ color: 'var(--muted)' }}
      >
        Industry
      </span>

      <div className="flex items-center gap-1.5">
        {MODES.map(({ id, label, shortLabel, icon: Icon }) => {
          const isActive = currentMode === id;
          return (
            <button
              key={id}
              onClick={() => handleModeChange(id)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 shrink-0"
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                borderColor:     isActive ? 'var(--accent)' : 'var(--border)',
                color:           isActive ? '#ffffff'        : 'var(--muted)',
                boxShadow:       isActive ? '0 2px 8px rgba(242,112,70,0.35)' : 'none',
                opacity:         isPending && !isActive ? 0.5 : 1,
                cursor:          isPending ? 'wait' : 'pointer',
              }}
            >
              <Icon size={12} />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{shortLabel}</span>
            </button>
          );
        })}
      </div>

      {isPending && (
        <span
          className="text-[10px] animate-pulse ml-1"
          style={{ color: 'var(--muted)' }}
        >
          Switching…
        </span>
      )}
    </div>
  );
}

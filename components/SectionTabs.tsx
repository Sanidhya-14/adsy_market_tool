'use client';
import { useState, type ElementType } from 'react';
import {
  LayoutGrid,
  Fuel,
  FlaskConical,
  Layers,
  Droplets,
  Atom,
  Pill,
  Package,
  AlertTriangle,
  TrendingUp,
  Flame,
  Beaker,
  Zap,
} from 'lucide-react';
import type { IndustryMode } from '@/lib/commodities';

interface Tab {
  id: string;
  label: string;
  icon: ElementType;
}

const TABS_BY_MODE: Record<IndustryMode, Tab[]> = {
  'specialty-chem': [
    { id: 'all',           label: 'All',           icon: LayoutGrid },
    { id: 'feedstocks',    label: 'Feedstocks',    icon: Fuel },
    { id: 'intermediates', label: 'Intermediates', icon: FlaskConical },
    { id: 'polymers',      label: 'Polymers',      icon: Layers },
    { id: 'solvents',      label: 'Solvents',      icon: Droplets },
    { id: 'specialty',     label: 'Specialty',     icon: Atom },
  ],
  'life-sciences': [
    { id: 'all',               label: 'All',               icon: LayoutGrid },
    { id: 'apis',              label: 'APIs',              icon: Pill },
    { id: 'excipients',        label: 'Excipients',        icon: Package },
    { id: 'solvents',          label: 'Solvents',          icon: Droplets },
    { id: 'drug-shortages',    label: 'Drug Shortages',    icon: AlertTriangle },
    { id: 'clinical-pipeline', label: 'Clinical Pipeline', icon: TrendingUp },
  ],
  'energy': [
    { id: 'all',           label: 'All',             icon: LayoutGrid },
    { id: 'crude-refined', label: 'Crude & Refined', icon: Fuel },
    { id: 'natural-gas',   label: 'Natural Gas',     icon: Flame },
    { id: 'biofuels',      label: 'Biofuels',        icon: Beaker },
    { id: 'power',         label: 'Power',           icon: Zap },
  ],
};

interface SectionTabsProps {
  mode: IndustryMode;
  onTabChange: (tabId: string) => void;
}

export default function SectionTabs({ mode, onTabChange }: SectionTabsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const tabs = TABS_BY_MODE[mode];

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    onTabChange(tabId);
  }

  return (
    <div
      className="no-print shrink-0 px-4 lg:px-6 py-3 border-b flex items-center gap-2 overflow-x-auto scrollbar-hide"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => handleTabClick(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 shrink-0 whitespace-nowrap"
            style={{
              backgroundColor: isActive ? 'var(--accent)' : 'transparent',
              borderColor:     isActive ? 'var(--accent)' : 'var(--border)',
              color:           isActive ? '#ffffff'        : 'var(--muted)',
              boxShadow:       isActive ? '0 2px 8px rgba(242,112,70,0.35)' : 'none',
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-5" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="relative flex items-center w-14 h-7 rounded-full border transition-colors duration-300 shrink-0"
      style={{
        backgroundColor: isDark ? '#1E2B4B' : '#CAE1EE',
        borderColor: isDark ? '#253F78' : '#B3C5D1',
      }}
    >
      {/* Track icons */}
      <Sun  size={12} className="absolute left-1.5 text-amber-400 opacity-70" />
      <Moon size={12} className="absolute right-1.5 text-brand-sky opacity-70" />
      {/* Thumb */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center"
        style={{
          backgroundColor: isDark ? '#F27046' : '#253F78',
          transform: isDark ? 'translateX(28px)' : 'translateX(2px)',
        }}
      >
        {isDark
          ? <Moon size={11} className="text-white" />
          : <Sun  size={11} className="text-white" />
        }
      </span>
    </button>
  );
}

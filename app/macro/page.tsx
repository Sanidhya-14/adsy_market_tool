import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import MacroAnalysis from '@/components/MacroAnalysis';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Macro Indicators | Adsy Global',
  description: 'CPI & PPI historical analysis powered by the U.S. Bureau of Labor Statistics API.',
};

export default function MacroPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur border-b px-4 lg:px-8 py-3"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <span style={{ color: 'var(--border)' }}>/</span>
          <div className="flex items-center gap-2">
            <BarChart2 size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Macro Indicators
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
              style={{ backgroundColor: 'var(--up-muted)', color: 'var(--up)', borderColor: 'var(--up)' }}
            >
              LIVE · BLS API
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>
            CPI &amp; PPI Analysis
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: 'var(--muted)' }}>
            Historical inflation data and component breakdown from the U.S. Bureau of Labor Statistics.
            Real index levels, year-over-year trends, and sub-category analysis across consumer and producer prices.
          </p>
        </div>

        <MacroAnalysis />
      </main>
    </div>
  );
}

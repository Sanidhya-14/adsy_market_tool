'use client';
import { Printer, Download } from 'lucide-react';

interface ExportButtonProps {
  commodityName: string;
  variant?: 'icon' | 'full';
}

export default function ExportButton({ commodityName, variant = 'full' }: ExportButtonProps) {
  function handlePrint() {
    window.print();
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handlePrint}
        title="Export / Print Report"
        className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors"
      >
        <Printer size={15} className="text-slate-400" />
      </button>
    );
  }

  return (
    <button
      onClick={handlePrint}
      className="no-print flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-medium text-slate-300 transition-colors"
    >
      <Download size={15} />
      Export Negotiation Brief
    </button>
  );
}

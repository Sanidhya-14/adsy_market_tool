import { FlaskConical } from 'lucide-react';

const SAMPLE_TRIALS = [
  { name: 'Semaglutide (NCT05898230)', phase: 'Phase III', sponsor: 'Novo Nordisk',    startDate: '2026-03-12', condition: 'Type 2 Diabetes' },
  { name: 'Lecanemab (NCT06012244)',   phase: 'Phase III', sponsor: 'Eisai',           startDate: '2026-02-28', condition: "Alzheimer's Disease" },
  { name: 'Pembrolizumab (NCT05935280)', phase: 'Phase II', sponsor: 'Merck',          startDate: '2026-04-01', condition: 'Solid Tumors' },
  { name: 'BNT162b2 (NCT06104388)',    phase: 'Phase III', sponsor: 'Pfizer-BioNTech', startDate: '2026-01-15', condition: 'COVID-19 variants' },
  { name: 'Tirzepatide (NCT05898123)', phase: 'Phase III', sponsor: 'Eli Lilly',       startDate: '2026-03-22', condition: 'Obesity' },
];

const PHASE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Phase I':   { bg: 'rgba(59,130,246,0.1)',  color: 'rgb(59,130,246)',  border: 'rgba(59,130,246,0.4)' },
  'Phase II':  { bg: 'rgba(245,158,11,0.1)',  color: 'rgb(245,158,11)', border: 'rgba(245,158,11,0.4)' },
  'Phase III': { bg: 'rgba(34,197,94,0.1)',   color: 'rgb(34,197,94)',  border: 'rgba(34,197,94,0.4)' },
};

export default function ClinicalPipelineFeed() {
  return (
    <div>
      <div className="mb-4">
        <span
          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: 'var(--accent-bg)',
            color: 'var(--accent)',
            borderColor: 'var(--accent-border)',
          }}
        >
          Sample Data — Live integration in v1.1
        </span>
      </div>

      <div className="space-y-3">
        {SAMPLE_TRIALS.map((item, i) => {
          const ps = PHASE_STYLES[item.phase] ?? PHASE_STYLES['Phase I'];
          return (
            <div
              key={i}
              className="rounded-xl border p-4 flex items-start gap-3"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="mt-0.5 shrink-0">
                <FlaskConical size={16} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {item.name}
                  </p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                    style={{ backgroundColor: ps.bg, color: ps.color, borderColor: ps.border }}
                  >
                    {item.phase}
                  </span>
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: 'var(--foreground)' }}>
                  {item.condition}
                </p>
                <div className="flex items-center gap-4 mt-1.5">
                  <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{item.sponsor}</p>
                  <p className="text-[10px]" style={{ color: 'var(--border)' }}>
                    Started {item.startDate}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

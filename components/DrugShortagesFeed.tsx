import { AlertTriangle, CheckCircle } from 'lucide-react';

const SAMPLE_SHORTAGES = [
  { name: 'Amoxicillin Capsules',             status: 'Currently in Shortage', updatedAt: '2026-04-28', reason: 'Increased demand' },
  { name: 'Methylphenidate ER Tablets',        status: 'Currently in Shortage', updatedAt: '2026-04-25', reason: 'Manufacturing delay' },
  { name: 'Albuterol Sulfate Inhalation',      status: 'Resolved',              updatedAt: '2026-04-20', reason: 'Resolved by manufacturer' },
  { name: 'Lidocaine Hydrochloride Injection', status: 'Currently in Shortage', updatedAt: '2026-04-18', reason: 'Active ingredient supply' },
  { name: 'Cefepime Hydrochloride Injection',  status: 'Currently in Shortage', updatedAt: '2026-04-15', reason: 'Manufacturing capacity' },
];

export default function DrugShortagesFeed() {
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
        {SAMPLE_SHORTAGES.map((item, i) => {
          const isShortage = item.status === 'Currently in Shortage';
          return (
            <div
              key={i}
              className="rounded-xl border p-4 flex items-start gap-3"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="mt-0.5 shrink-0">
                {isShortage
                  ? <AlertTriangle size={16} style={{ color: 'var(--down)' }} />
                  : <CheckCircle   size={16} style={{ color: 'var(--up)' }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {item.name}
                  </p>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                    style={
                      isShortage
                        ? { backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--down)', borderColor: 'var(--down)' }
                        : { backgroundColor: 'var(--up-muted)',     color: 'var(--up)',   borderColor: 'var(--up)' }
                    }
                  >
                    {item.status}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{item.reason}</p>
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--border)' }}>
                  Updated {item.updatedAt}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GeoBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export default function GeoBadge({
  label = '🇺🇸 North American Market',
  size = 'sm',
}: GeoBadgeProps) {
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium ${textSize}`}
      style={{
        backgroundColor: 'var(--card-2)',
        borderColor: 'var(--border)',
        color: 'var(--muted)',
      }}
    >
      {label}
    </span>
  );
}

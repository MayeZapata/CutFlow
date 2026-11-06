interface KpiCardProps {
  title: string;
  value: string | number;
  /** Tailwind text color class for the title, e.g. 'text-success' */
  colorClass?: string;
}

export default function KpiCard({ title, value, colorClass = 'text-muted' }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
      <h3 className={`text-xs font-medium tracking-wide uppercase ${colorClass}`}>{title}</h3>
      <p className="mt-1 font-display text-2xl font-semibold text-cream">{value}</p>
    </div>
  );
}

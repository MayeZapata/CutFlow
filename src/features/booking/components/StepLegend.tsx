interface StepLegendProps {
  step: number;
  title: string;
  description?: string;
}

/** Visual step heading. Must be rendered as the first child of a <fieldset>. */
export default function StepLegend({ step, title, description }: StepLegendProps) {
  return (
    <legend className="mb-4 flex items-start gap-3">
      <span
        aria-hidden="true"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-sm font-semibold text-gold"
      >
        {step}
      </span>
      <span>
        <span className="block font-display text-lg font-semibold">{title}</span>
        {description ? <span className="block text-sm text-muted">{description}</span> : null}
      </span>
    </legend>
  );
}

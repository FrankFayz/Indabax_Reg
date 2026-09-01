const SLICE_COLORS = [
  "#004D38",
  "#FFC400",
  "#1D4E89",
  "#C2410C",
  "#0F766E",
  "#6D28D9",
  "#BE123C",
  "#334155",
  "#4D7C0F",
];

function conicGradient(items, total) {
  const gap = items.length > 1 ? 0.7 : 0;
  const usable = 100 - gap * items.length;
  let start = 0;
  const stops = [];

  items.forEach((item, index) => {
    const share = (item.count / total) * usable;
    const end = start + share;
    const color = SLICE_COLORS[index % SLICE_COLORS.length];
    stops.push(`${color} ${start}% ${end}%`);
    start = end;
    if (gap) {
      stops.push(`#ffffff ${start}% ${start + gap}%`);
      start += gap;
    }
  });

  return `conic-gradient(${stops.join(", ")})`;
}

export function PieCard({ title, items = [] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <article className="rounded-md border border-cream-dark bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">None yet.</p>
      ) : (
        <div className="mt-4 flex items-start gap-4">
          <div
            className="relative h-24 w-24 shrink-0 rounded-full"
            style={{ background: conicGradient(items, total) }}
            aria-hidden="true"
          >
            <div className="absolute inset-[26%] flex items-center justify-center rounded-full bg-surface">
              <p className="font-display text-lg leading-none text-ink tabular-nums">
                {total}
              </p>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-1">
            {items.map((item, index) => {
              const percent = Math.round((item.count / total) * 100);
              return (
                <li
                  key={item.key}
                  className="flex min-w-0 items-start justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-[2px]"
                      style={{
                        background: SLICE_COLORS[index % SLICE_COLORS.length],
                      }}
                    />
                    <span className="min-w-0 leading-snug break-words text-ink">
                      {item.label}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-ink-muted">
                    {item.count} · {percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

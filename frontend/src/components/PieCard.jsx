const SLICE_COLORS = [
  "#0f7a4a",
  "#e8b423",
  "#0a5634",
  "#17a05f",
  "#c48912",
  "#dc4336",
  "#3d6b4f",
  "#8b6914",
  "#5c8a6a",
];

function conicGradient(items, total) {
  let start = 0;
  const stops = items.map((item, index) => {
    const share = (item.count / total) * 100;
    const end = start + share;
    const color = SLICE_COLORS[index % SLICE_COLORS.length];
    const stop = `${color} ${start}% ${end}%`;
    start = end;
    return stop;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function PieCard({ title, items = [] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <article className="min-h-64 rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {total === 0 ? (
        <p className="mt-8 text-center text-sm text-ink-muted">None yet.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-4">
          <div
            className="relative h-36 w-36 shrink-0 rounded-full"
            style={{ background: conicGradient(items, total) }}
            aria-hidden="true"
          >
            <div className="absolute inset-[27%] flex flex-col items-center justify-center rounded-full bg-white">
              <p className="font-display text-2xl leading-none text-indaba-dark tabular-nums">
                {total}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                Total
              </p>
            </div>
          </div>
          <ul className="w-full min-w-0 space-y-1.5">
            {items.map((item, index) => {
              const percent = Math.round((item.count / total) * 100);
              return (
                <li
                  key={item.key}
                  className="flex min-w-0 items-start justify-between gap-2 text-xs"
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <span
                      className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
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

import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

export function BackLink({ to = "/", label = "Back" }) {
  return (
    <Link
      to={to}
      className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-cream-dark bg-white px-3 text-sm font-semibold text-indaba-dark no-underline shadow-sm transition hover:border-gold hover:bg-gold-soft/40"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 fill-current"
        aria-hidden="true"
      >
        <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.42 10l4.3 4.3a1 1 0 1 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.42 0z" />
      </svg>
      {label}
    </Link>
  );
}

export function Page({ children, right, width = "max-w-lg" }) {
  return (
    <div className="page-shell w-full">
      <header className="site-header min-w-0">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="min-w-0 no-underline"
            aria-label="IndabaX AI Club Kabale University"
          >
            <span className="brand-slot">
              <img
                src="/logos/indabax-kabale.png"
                alt="IndabaX AI Club Kabale University"
                className="brand-mark"
                width={353}
                height={176}
                fetchPriority="high"
                decoding="async"
              />
            </span>
          </Link>
          {right}
        </div>
      </header>

      <main className="min-w-0 w-full">
        <div className={`mx-auto w-full min-w-0 ${width} px-4 py-5 sm:px-6 sm:py-8`}>
          {children}
        </div>
      </main>

      <footer className="min-w-0 border-t border-gold/50 bg-white">
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-start gap-3 px-4 py-4 sm:max-w-3xl sm:gap-8 sm:px-6">
          <a
            href="https://www.kab.ac.ug/"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-col items-center no-underline"
          >
            <span className="partner-slot">
              <img
                src="/logos/kabale-university.jpg"
                alt="Kabale University"
                className="partner-mark"
                width={600}
                height={600}
                decoding="async"
              />
            </span>
            <span className="mt-1.5 px-1 text-center text-[10px] leading-tight text-ink-muted sm:text-[11px]">
              Knowledge is the future
            </span>
          </a>
          <div className="flex min-w-0 flex-col items-center">
            <span className="partner-slot">
              <img
                src="/logos/cosaku.png"
                alt="COSAKU"
                className="partner-mark"
                width={702}
                height={711}
                decoding="async"
              />
            </span>
            <span className="mt-1.5 px-1 text-center text-[10px] leading-tight text-ink-muted sm:text-[11px]">
              Moving technology to another level
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Field({ id, label, error, children }) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-1 text-left">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      {children}
      <p
        className={`field-hint ${error ? "text-terracotta" : "invisible"}`}
        role={error ? "alert" : undefined}
      >
        {error || "\u00a0"}
      </p>
    </div>
  );
}

export const inputClass =
  "field-control h-11 rounded-xl border border-cream-dark bg-white px-3 text-base text-ink outline-none shadow-sm transition-[border-color,box-shadow] placeholder:text-stone-400 focus:border-indaba focus:ring-4 focus:ring-indaba/15";

export const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-indaba text-base font-semibold text-white shadow-[0_10px_22px_rgba(15,122,74,0.28)] transition-[background-color,transform,box-shadow] hover:bg-indaba-dark hover:shadow-[0_12px_26px_rgba(10,86,52,0.32)] active:translate-y-px disabled:opacity-60";

export function ChoiceSelect({
  id,
  value,
  onChange,
  options = [],
  placeholder = "Choose",
  required = false,
  "aria-label": ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const selected = options.find((item) => item.value === value);

  useEffect(() => {
    function onPointer(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function choose(next) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 w-full max-w-full">
      <button
        type="button"
        id={id}
        className="field-control flex min-h-11 w-full items-start justify-between gap-3 rounded-xl border border-cream-dark bg-white py-2.5 pl-3 pr-3 text-left text-base shadow-sm outline-none transition-[border-color,box-shadow] focus:border-indaba focus:ring-4 focus:ring-indaba/15"
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`min-w-0 flex-1 whitespace-normal break-words leading-snug ${
            selected ? "text-ink" : "text-stone-400"
          }`}
        >
          {selected?.label || placeholder}
        </span>
        <svg
          viewBox="0 0 12 8"
          className={`mt-1.5 h-2.5 w-3 shrink-0 fill-indaba-dark transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path d="M1 1l5 5 5-5" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-x-hidden overflow-y-auto rounded-xl border border-cream-dark bg-white py-1 shadow-xl"
        >
          <li>
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left text-sm leading-snug text-ink-muted hover:bg-cream"
              onClick={() => choose("")}
            >
              {placeholder}
            </button>
          </li>
          {options.map((item) => (
            <li key={item.value} role="option" aria-selected={item.value === value}>
              <button
                type="button"
                className={`w-full px-3 py-2.5 text-left text-sm leading-snug whitespace-normal break-words ${
                  item.value === value
                    ? "bg-cream font-semibold text-indaba-dark"
                    : "text-ink hover:bg-cream"
                }`}
                onClick={() => choose(item.value)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

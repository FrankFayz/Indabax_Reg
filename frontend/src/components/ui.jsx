import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

export function BackLink({ to = "/", label = "Back" }) {
  return (
    <Link
      to={to}
      className="mb-5 inline-flex h-9 items-center gap-1.5 text-sm font-medium text-ink-muted no-underline transition-colors hover:text-ink"
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

      <footer className="site-footer min-w-0">
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-start gap-3 px-4 py-5 sm:max-w-3xl sm:gap-8 sm:px-6">
          <a
            href="https://www.kab.ac.ug/"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-col items-center no-underline"
          >
            <span className="partner-plate">
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
            </span>
            <span className="mt-2 px-1 text-center text-[10px] leading-tight text-on-forest/70 sm:text-[11px]">
              Knowledge is the future
            </span>
          </a>
          <div className="flex min-w-0 flex-col items-center">
            <span className="partner-plate">
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
            </span>
            <span className="mt-2 px-1 text-center text-[10px] leading-tight text-on-forest/70 sm:text-[11px]">
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
  "field-control h-11 rounded-md border border-cream-dark bg-field px-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-gold focus:bg-surface";

export const primaryBtn =
  "inline-flex h-11 w-full items-center justify-center rounded-md bg-indaba text-base font-semibold text-white transition-colors hover:bg-indaba-dark disabled:opacity-60";

export const secondaryBtn =
  "inline-flex h-11 items-center justify-center rounded-md border border-cream-dark bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-40";

export const headerBtn =
  "shrink-0 rounded-md border border-gold bg-transparent px-3 py-1.5 text-[11px] font-semibold tracking-wide text-on-forest no-underline transition-colors hover:bg-forest-mid sm:px-3.5";

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
        className="field-control flex min-h-11 w-full items-start justify-between gap-3 rounded-md border border-cream-dark bg-field py-2.5 pl-3 pr-3 text-left text-base outline-none transition-colors focus:border-gold focus:bg-surface"
        aria-label={ariaLabel}
        aria-required={required || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <span
          className={`min-w-0 flex-1 whitespace-normal break-words leading-snug ${
            selected ? "text-ink" : "text-ink-muted/70"
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
          className="absolute z-50 mt-1 max-h-60 w-full overflow-x-hidden overflow-y-auto rounded-md border border-cream-dark bg-surface py-1"
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

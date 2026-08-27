import { Link } from "react-router-dom";

export function Page({ children, right, width = "max-w-lg" }) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-cream">
      <header className="site-header">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-2.5">
          <Link
            to="/"
            className="min-w-0 no-underline"
            aria-label="IndabaX AI Club Kabale University"
          >
            <img
              src="/logos/indabax-kabale.png"
              alt="IndabaX AI Club Kabale University"
              className="brand-mark"
            />
          </Link>
          {right}
        </div>
      </header>

      <main
        className={`mx-auto w-full min-w-0 flex-1 ${width} px-3 py-4 sm:px-6 sm:py-8`}
      >
        {children}
      </main>

      <footer className="mt-auto w-full border-t border-gold bg-white">
        <div className="mx-auto grid w-full max-w-lg grid-cols-2 items-center gap-2 px-3 py-3 sm:max-w-3xl sm:gap-8 sm:px-6">
          <a
            href="https://www.kab.ac.ug/"
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-col items-center no-underline"
          >
            <img
              src="/logos/kabale-university.jpg"
              alt="Kabale University"
              className="h-9 w-auto max-w-[46vw] object-contain sm:h-12 sm:max-w-full"
            />
            <span className="mt-1 px-1 text-center text-[9px] leading-tight text-ink-muted sm:text-[11px]">
              Knowledge is the future
            </span>
          </a>
          <div className="flex min-w-0 flex-col items-center">
            <img
              src="/logos/cosaku.png"
              alt="COSAKU"
              className="h-9 w-auto max-w-[46vw] object-contain sm:h-12 sm:max-w-full"
            />
            <span className="mt-1 px-1 text-center text-[9px] leading-tight text-ink-muted sm:text-[11px]">
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
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "field-control h-12 rounded-lg border border-cream-dark bg-white px-3 text-base text-ink outline-none transition placeholder:text-stone-400 focus:border-gold focus:ring-2 focus:ring-gold/30";

export const primaryBtn =
  "inline-flex h-12 w-full items-center justify-center rounded-lg bg-indaba text-base font-bold text-white transition hover:bg-indaba-dark disabled:opacity-60";

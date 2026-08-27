import { Link, Navigate, useLocation } from "react-router-dom";
import { Page, primaryBtn } from "../components/ui";

export default function SuccessPage() {
  const result = useLocation().state;

  if (!result?.registration_code) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page>
      <div className="text-center">
        <h1 className="font-display text-3xl text-indaba-dark sm:text-4xl">
          You’re in.
        </h1>
        <p className="mt-1 text-ink-muted">{result.full_name}</p>

        <div className="mt-6 rounded-2xl border border-cream-dark border-t-[6px] border-t-gold bg-white px-4 py-6">
          <p className="text-[11px] font-bold tracking-[0.16em] text-ink-muted uppercase">
            Your code
          </p>
          <p className="font-display mt-1 text-2xl tracking-wide text-indaba sm:text-3xl">
            {result.registration_code}
          </p>
        </div>

        <Link to="/" className={`${primaryBtn} mx-auto mt-6 max-w-xs no-underline`}>
          Register another
        </Link>
      </div>
    </Page>
  );
}

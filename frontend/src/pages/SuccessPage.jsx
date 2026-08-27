import { Link, Navigate, useLocation } from "react-router-dom";
import { BackLink, Page } from "../components/ui";

const WHATSAPP_GROUP =
  "https://chat.whatsapp.com/LJyKt5JOZKt1PqTiR9s4Gv?s=sw&p=a&mlu=4";

export default function SuccessPage() {
  const result = useLocation().state;

  if (!result?.full_name) {
    return <Navigate to="/" replace />;
  }

  return (
    <Page>
      <BackLink to="/" label="Back to register" />
      <div className="form-card rounded-md px-6 py-10 text-center sm:px-10">
        <h1 className="page-title">You’re in.</h1>
        <p className="mt-2 text-sm text-ink-muted">{result.full_name}</p>
        {result.event_name ? (
          <p className="mt-1 text-sm text-ink">Registered for {result.event_name}</p>
        ) : null}
        <p className="mt-5 text-sm text-ink-muted">
          Join the IndabaX WhatsApp group to stay updated.
        </p>

        <a
          href={WHATSAPP_GROUP}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-md bg-[#128C4E] px-4 text-base font-semibold text-white no-underline transition-colors hover:bg-[#0f7a43]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-current"
            aria-hidden="true"
          >
            <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.95.51 3.86 1.48 5.54L2 22l4.71-1.54a9.86 9.86 0 0 0 5.33 1.52h.01c5.46 0 9.89-4.43 9.89-9.89C21.94 6.43 17.5 2 12.04 2zm5.72 14.01c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.95-.31-1.64-.61-2.89-1.25-4.77-4.16-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.29.01.44.03.63.49.24.55.81 1.98.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.37-.42.49-.14.14-.28.29-.12.56.16.27.7 1.16 1.5 1.88 1.04.93 1.91 1.22 2.18 1.36.27.13.43.11.59-.07.16-.18.68-.8.86-1.07.18-.27.36-.22.61-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.07.11.07.64-.17 1.32z" />
          </svg>
          Join WhatsApp group
        </a>

        <Link
          to="/"
          className="mt-5 inline-block text-sm font-medium text-ink-muted no-underline hover:text-ink"
        >
          Register another
        </Link>
      </div>
    </Page>
  );
}

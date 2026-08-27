import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  downloadExport,
  fetchChoices,
  fetchRegistrants,
  fetchStats,
  isLoggedIn,
  setToken,
} from "../lib/api";
import { Page, inputClass, BackLink, ChoiceSelect } from "../components/ui";

const PAGE_SIZE = 25;

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString("en-UG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [choices, setChoices] = useState(null);
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const loadId = useRef(0);

  const load = useCallback(
    async (query, facultyFilter, nextPage) => {
      const id = ++loadId.current;
      setError("");
      try {
        const [nextStats, list] = await Promise.all([
          fetchStats(),
          fetchRegistrants(query, facultyFilter, nextPage),
        ]);
        if (id !== loadId.current) return;
        setStats(nextStats);
        setRows(list.results || []);
        setCount(list.count || 0);
        setPage(list.page || 1);
        setTotalPages(list.total_pages || 1);
      } catch (err) {
        if (id !== loadId.current) return;
        if (err.status === 401) {
          setToken("");
          navigate("/organizer");
          return;
        }
        setError("Could not load registrants.");
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/organizer");
      return;
    }
    fetchChoices().then(setChoices).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn()) return;
      load(search, faculty, page);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, faculty, page, load]);

  function logout() {
    setToken("");
    navigate("/");
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadExport();
    } catch {
      setError("Could not export the CSV.");
    } finally {
      setExporting(false);
    }
  }

  const maxFaculty = Math.max(
    1,
    ...(stats?.by_faculty || []).map((item) => item.count)
  );

  return (
    <Page
      width="max-w-6xl"
      right={
        <button
          type="button"
          onClick={logout}
          className="rounded-full bg-indaba px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-[0_6px_14px_rgba(15,122,74,0.28)] hover:bg-indaba-dark"
        >
          Sign out
        </button>
      }
    >
      <BackLink to="/" label="Back to register" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">Who is registered.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="h-11 rounded-xl bg-indaba px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(15,122,74,0.25)] hover:bg-indaba-dark disabled:opacity-60"
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      <p className={`alert-slot mt-3 text-sm font-medium ${error ? "text-terracotta" : "invisible"}`}>
        {error || "\u00a0"}
      </p>

      <section className="mt-2 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-indaba p-4 text-white shadow-[0_14px_28px_rgba(15,122,74,0.28)]">
          <p className="text-sm font-semibold text-gold-soft">Registered</p>
          <p className="font-display mt-1 min-h-12 text-4xl tabular-nums">
            {stats?.total ?? "—"}
          </p>
        </article>
        <article className="min-h-40 rounded-2xl border border-cream-dark bg-surface p-4 sm:col-span-2">
          <p className="text-sm font-bold text-ink">By faculty</p>
          <div className="mt-3 space-y-2">
            {(stats?.by_faculty || []).length === 0 ? (
              <p className="text-sm text-ink-muted">None yet.</p>
            ) : (
              (stats?.by_faculty || []).map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between gap-2 text-xs text-ink-muted">
                    <span className="truncate">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-dark">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(item.count / maxFaculty) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <div className="mt-3 flex min-h-8 flex-wrap gap-2">
        {(stats?.by_year || []).map((item) => (
          <span
            key={item.key}
            className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink ring-1 ring-cream-dark"
          >
            {item.label}: {item.count}
          </span>
        ))}
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(12rem,22rem)]">
        <input
          className={inputClass}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or number"
          aria-label="Search registrants"
        />
        <ChoiceSelect
          id="faculty-filter"
          value={faculty}
          onChange={(value) => {
            setFaculty(value);
            setPage(1);
          }}
          options={choices?.faculties || []}
          placeholder="All faculties"
          aria-label="Filter by faculty"
        />
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-surface px-4 py-8 text-center text-ink-muted ring-1 ring-cream-dark">
            No matches.
          </p>
        ) : (
          rows.map((person) => (
            <article
              key={person.id}
              className="rounded-2xl border border-cream-dark border-t-[3px] border-t-gold bg-surface p-4"
            >
              <p className="font-bold text-indaba">{person.registration_code}</p>
              <p className="mt-1 font-semibold">{person.full_name}</p>
              <p className="text-sm text-ink-muted">
                {person.faculty_label} · {person.year_label}
              </p>
              <p className="text-sm">{person.program}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {person.phone} · {formatWhen(person.created_at)}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-cream-dark bg-surface md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Code</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Faculty</th>
              <th className="px-4 py-3 font-bold">Program</th>
              <th className="px-4 py-3 font-bold">Year</th>
              <th className="px-4 py-3 font-bold">Phone</th>
              <th className="px-4 py-3 font-bold">Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  No matches.
                </td>
              </tr>
            ) : (
              rows.map((person) => (
                <tr key={person.id} className="border-t border-cream-dark">
                  <td className="px-4 py-3 font-bold whitespace-nowrap text-indaba">
                    {person.registration_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{person.full_name}</div>
                    <div className="text-xs text-ink-muted">
                      {person.student_number}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{person.faculty_label}</td>
                  <td className="px-4 py-3">{person.program}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{person.year_label}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{person.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {formatWhen(person.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {count === 0
            ? "0 of 0"
            : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, count)} of ${count}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-11 rounded-xl border border-cream-dark bg-white px-4 text-sm font-semibold text-indaba-dark shadow-sm hover:border-gold hover:bg-gold-soft/40 disabled:opacity-40"
          >
            Previous
          </button>
          <p className="min-w-24 text-center text-sm font-semibold text-ink">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-11 rounded-xl border border-cream-dark bg-white px-4 text-sm font-semibold text-indaba-dark shadow-sm hover:border-gold hover:bg-gold-soft/40 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Page>
  );
}

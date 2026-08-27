import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  downloadExport,
  fetchChoices,
  fetchRegistrants,
  fetchStats,
  isLoggedIn,
  setToken,
} from "../lib/api";
import { Page, inputClass } from "../components/ui";

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
  const [choices, setChoices] = useState(null);
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (query, facultyFilter) => {
      setError("");
      try {
        const [nextStats, nextRows] = await Promise.all([
          fetchStats(),
          fetchRegistrants(query, facultyFilter),
        ]);
        setStats(nextStats);
        setRows(nextRows);
      } catch (err) {
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
      load(search, faculty);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, faculty, load]);

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
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="hidden text-[11px] font-bold tracking-wide text-indaba uppercase no-underline sm:inline"
          >
            Form
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-indaba px-3.5 py-2 text-[11px] font-bold tracking-wide text-white uppercase hover:bg-indaba-dark"
          >
            Sign out
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] text-indaba-dark sm:text-4xl">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-ink-muted sm:text-base">Who is registered.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="h-11 rounded-xl bg-indaba px-4 text-sm font-bold text-white hover:bg-indaba-dark disabled:opacity-60"
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-terracotta">{error}</p> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-indaba p-4 text-white">
          <p className="text-sm font-semibold text-gold">Registered</p>
          <p className="font-display mt-1 text-4xl">{stats?.total ?? "—"}</p>
        </article>
        <article className="rounded-2xl border-2 border-cream-dark bg-white p-4 sm:col-span-2">
          <p className="text-sm font-bold text-ink">By faculty</p>
          <div className="mt-3 space-y-2">
            {(stats?.by_faculty || []).length === 0 ? (
              <p className="text-sm text-ink-muted">None yet.</p>
            ) : (
              (stats?.by_faculty || []).map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between gap-2 text-xs text-ink-muted">
                    <span className="truncate">{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
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

      {(stats?.by_year || []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {stats.by_year.map((item) => (
            <span
              key={item.key}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink ring-2 ring-cream-dark"
            >
              {item.label}: {item.count}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_12rem]">
        <input
          className={inputClass}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or number"
          aria-label="Search registrants"
        />
        <select
          className={inputClass}
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          aria-label="Filter by faculty"
        >
          <option value="">All faculties</option>
          {(choices?.faculties || []).map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3 md:hidden">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-ink-muted">
            No matches.
          </p>
        ) : (
          rows.map((person) => (
            <article
              key={person.id}
              className="rounded-2xl border-2 border-cream-dark border-t-4 border-t-gold bg-white p-4"
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

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border-2 border-cream-dark bg-white md:block">
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
    </Page>
  );
}

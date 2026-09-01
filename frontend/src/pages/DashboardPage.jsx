import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  downloadExport,
  fetchChoices,
  fetchEvents,
  fetchRegistrants,
  fetchStats,
  isLoggedIn,
  setToken,
} from "../lib/api";
import { Page, inputClass, BackLink, ChoiceSelect, headerBtn, secondaryBtn } from "../components/ui";
import { EventMenu, EventToolbar, bucketOf, formatEventDate } from "../components/EventBoard";
import { PieCard } from "../components/PieCard";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get("event") || "";
  const view = searchParams.get("view") || "all";
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [choices, setChoices] = useState(null);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const loadId = useRef(0);

  const selectedEvent = events.find(
    (item) => String(item.id) === String(selectedEventId)
  );
  const hasLive = events.some((item) => bucketOf(item) === "active");

  const loadEvents = useCallback(async () => {
    const data = await fetchEvents();
    setEvents(data.results || []);
  }, []);

  const load = useCallback(
    async (query, facultyFilter, nextPage, eventId) => {
      const id = ++loadId.current;
      setError("");
      try {
        const [nextStats, list] = await Promise.all([
          fetchStats(eventId),
          fetchRegistrants(query, facultyFilter, nextPage, eventId),
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
    loadEvents().catch(() => setError("Could not load events."));
  }, [navigate, loadEvents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn()) return;
      load(search, faculty, page, selectedEventId);
    }, 250);
    return () => clearTimeout(timer);
  }, [search, faculty, page, selectedEventId, load]);

  function logout() {
    setToken("");
    navigate("/");
  }

  function setParams({ eventId = selectedEventId, nextView = view }) {
    const params = new URLSearchParams();
    if (nextView && nextView !== "all") params.set("view", nextView);
    if (eventId) params.set("event", eventId);
    setSearchParams(params);
    setPage(1);
  }

  function selectEvent(nextId) {
    const picked = events.find((item) => String(item.id) === String(nextId));
    const nextView = picked ? bucketOf(picked) : "all";
    setParams({ eventId: nextId, nextView: nextId ? nextView : view === "all" ? "all" : view });
  }

  function selectView(nextView) {
    if (nextView === "all") {
      setParams({ eventId: "", nextView: "all" });
      return;
    }
    const stillFits = selectedEvent && bucketOf(selectedEvent) === nextView;
    setParams({
      eventId: stillFits ? selectedEventId : "",
      nextView,
    });
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

  return (
    <Page
      width="max-w-6xl"
      joinPartners={false}
      right={
        <button type="button" onClick={logout} className={headerBtn}>
          Sign out
        </button>
      }
    >
      <BackLink to="/" label="Back to register" />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {selectedEvent
              ? `${selectedEvent.name} · ${formatEventDate(selectedEvent.event_date)}`
              : "All attendants, one row per Kabale email."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={secondaryBtn}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm font-medium text-terracotta">{error}</p>
      ) : (
        <p className="alert-slot mt-3 text-sm font-medium invisible">&nbsp;</p>
      )}

      <div className="mt-1">
        <EventMenu
          events={events}
          selectedId={selectedEventId}
          view={view}
          onView={selectView}
          onSelect={selectEvent}
          onRefresh={loadEvents}
          onError={setError}
        />
      </div>

      {selectedEvent ? (
        <div className="mt-3">
          <EventToolbar
            event={selectedEvent}
            hasLive={hasLive}
            onRefresh={loadEvents}
            onError={setError}
            onSelect={(id) => setParams({ eventId: id, nextView: view })}
          />
        </div>
      ) : null}

      <section className="mt-5">
        <article className="flex items-end justify-between rounded-md border border-cream-dark bg-surface px-4 py-4">
          <p className="text-sm text-ink-muted">
            {selectedEvent ? "This event" : "Attendants"}
          </p>
          <p className="font-display text-4xl leading-none tabular-nums text-ink">
            {stats?.total ?? "—"}
          </p>
        </article>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PieCard title="Sex" items={stats?.by_gender} />
          <PieCard title="Year of study" items={stats?.by_year} />
          <PieCard title="Faculty" items={stats?.by_faculty} />
          <PieCard title="Program" items={stats?.by_program} />
        </div>
      </section>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,22rem)]">
        <input
          className={inputClass}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or email"
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
          <p className="rounded-md bg-surface px-4 py-8 text-center text-ink-muted ring-1 ring-cream-dark">
            No matches.
          </p>
        ) : (
          rows.map((person) => (
            <article
              key={person.id}
              className="rounded-md border border-cream-dark bg-surface p-4"
            >
              <p className="font-bold text-indaba">{person.registration_code}</p>
              <p className="mt-1 font-semibold">{person.full_name}</p>
              <p className="text-sm text-ink-muted">{person.email}</p>
              <p className="text-sm text-ink-muted">
                {person.faculty_label} · {person.year_label}
                {person.gender_label ? ` · ${person.gender_label}` : ""}
              </p>
              <p className="text-sm">{person.program}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {person.phone} · {formatWhen(person.attended_at || person.created_at)}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-md border border-cream-dark bg-surface md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-cream text-xs tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Code</th>
              <th className="px-4 py-3 font-bold">Name</th>
              <th className="px-4 py-3 font-bold">Sex</th>
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
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
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
                    <div className="text-xs text-ink-muted">{person.email}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {person.gender_label || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{person.faculty_label}</td>
                  <td className="px-4 py-3">{person.program}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{person.year_label}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{person.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {formatWhen(person.attended_at || person.created_at)}
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
            className={secondaryBtn}
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
            className={secondaryBtn}
          >
            Next
          </button>
        </div>
      </div>
    </Page>
  );
}

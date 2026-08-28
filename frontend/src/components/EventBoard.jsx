import { useMemo, useState } from "react";
import {
  closeEvent,
  createEvent,
  deleteEvent,
  downloadEventExport,
  firstError,
  openEvent,
} from "../lib/api";
import { inputClass, primaryBtn, secondaryBtn } from "./ui";

export function formatEventDate(iso) {
  if (!iso) return "";
  try {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-UG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function bucketOf(item) {
  if (item.status === "active" || item.status === "upcoming" || item.status === "past") {
    return item.status;
  }
  if (item.registration_open) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${item.event_date}T00:00:00`);
  return date < today ? "past" : "upcoming";
}

function byDateAsc(a, b) {
  if (a.event_date === b.event_date) return a.id - b.id;
  return a.event_date < b.event_date ? -1 : 1;
}

function byDateDesc(a, b) {
  return byDateAsc(b, a);
}

function StatusMark({ item }) {
  const past = bucketOf(item) === "past";
  const label = item.registration_open ? "Live" : past ? "Done" : "Soon";
  return (
    <span
      className={`shrink-0 text-[10px] font-semibold tracking-wide uppercase ${
        item.registration_open ? "text-indaba" : "text-ink-muted"
      }`}
    >
      {label}
    </span>
  );
}

export function EventMenu({
  events,
  selectedId,
  view,
  onView,
  onSelect,
  onRefresh,
  onError,
}) {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(item) {
    const ok = window.confirm(
      `Delete “${item.name}” and all attendance for this session? This cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(item.id);
    onError("");
    try {
      await deleteEvent(item.id);
      if (String(selectedId) === String(item.id)) onSelect("");
      await onRefresh();
    } catch (err) {
      onError(firstError(err.data) || "Could not delete the event.");
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = useMemo(
    () => ({
      active: events.filter((item) => bucketOf(item) === "active"),
      upcoming: events
        .filter((item) => bucketOf(item) === "upcoming")
        .sort(byDateAsc),
      past: events.filter((item) => bucketOf(item) === "past").sort(byDateDesc),
    }),
    [events]
  );

  const tabs = [
    { id: "all", label: "All attendants" },
    { id: "active", label: "Live", count: grouped.active.length },
    { id: "upcoming", label: "Upcoming", count: grouped.upcoming.length },
    { id: "past", label: "Past", count: grouped.past.length },
  ];

  const list = view === "all" ? [] : grouped[view] || [];

  async function handleCreate(event) {
    event.preventDefault();
    if (!name.trim() || !eventDate) return;
    setSaving(true);
    onError("");
    try {
      const created = await createEvent({
        name: name.trim(),
        event_date: eventDate,
      });
      setName("");
      setEventDate("");
      await onRefresh();
      onView("upcoming");
      onSelect(String(created.id));
    } catch (err) {
      onError(firstError(err.data) || "Could not add the event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-cream-dark bg-surface">
      <nav className="flex flex-wrap border-b border-cream-dark" aria-label="Events">
        {tabs.map((tab) => {
          const current = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onView(tab.id);
                if (tab.id === "all") onSelect("");
              }}
              className={`h-11 px-4 text-sm font-semibold ${
                current
                  ? "border-b-2 border-indaba text-indaba-dark"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.count != null ? (
                <span className="ml-1.5 font-medium text-ink-muted">{tab.count}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {view === "all" ? (
        <p className="px-4 py-3 text-sm text-ink-muted">
          Master list: one row per Kabale email.
        </p>
      ) : list.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink-muted">
          No {view === "active" ? "live" : view} sessions yet.
        </p>
      ) : (
        <ul className="divide-y divide-cream-dark">
          {list.map((item) => {
            const selected = String(item.id) === String(selectedId);
            return (
              <li
                key={item.id}
                className={`flex items-stretch ${selected ? "bg-cream" : "hover:bg-cream/60"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(String(item.id))}
                  className="min-w-0 flex-1 px-4 py-3 text-left"
                >
                  <span className="block truncate font-semibold text-ink">{item.name}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {formatEventDate(item.event_date)} · {item.attendance_count} registered
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-2 pr-3">
                  <StatusMark item={item} />
                  <button
                    type="button"
                    className={`${secondaryBtn} h-9 px-3 text-xs text-terracotta`}
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item)}
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form
        onSubmit={handleCreate}
        className="grid grid-cols-1 gap-2 border-t border-cream-dark p-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]"
      >
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New event name"
          aria-label="Event name"
          required
        />
        <input
          className={inputClass}
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          aria-label="Event date"
          required
        />
        <button type="submit" disabled={saving} className={`${primaryBtn} w-auto px-4`}>
          {saving ? "Adding…" : "Add event"}
        </button>
      </form>
    </section>
  );
}

export function EventToolbar({
  event,
  hasLive,
  onRefresh,
  onError,
  onSelect,
}) {
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  if (!event) return null;

  const past = bucketOf(event) === "past";
  const canEnable = !hasLive && !past && !event.registration_open;

  async function run(action) {
    setBusy(true);
    onError("");
    try {
      await action();
      await onRefresh();
    } catch (err) {
      onError(firstError(err.data) || "Could not update the event.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEventExport() {
    setExporting(true);
    onError("");
    try {
      await downloadEventExport(event);
    } catch {
      onError("Could not export this event CSV.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {event.registration_open ? (
        <button
          type="button"
          className={secondaryBtn}
          disabled={busy}
          onClick={() => run(() => closeEvent(event.id))}
        >
          Close registration
        </button>
      ) : canEnable ? (
        <button
          type="button"
          className={`${primaryBtn} w-auto px-4`}
          disabled={busy}
          onClick={() => run(() => openEvent(event.id))}
        >
          Open registration
        </button>
      ) : null}
      <button
        type="button"
        className={secondaryBtn}
        disabled={exporting}
        onClick={handleEventExport}
      >
        {exporting ? "Exporting…" : "Export event CSV"}
      </button>
      <button
        type="button"
        className={`${secondaryBtn} text-terracotta`}
        disabled={busy}
        onClick={() => {
          const ok = window.confirm(
            `Delete “${event.name}” and all attendance for this session? This cannot be undone.`
          );
          if (!ok) return;
          run(async () => {
            await deleteEvent(event.id);
            onSelect("");
          });
        }}
      >
        Delete event
      </button>
    </div>
  );
}

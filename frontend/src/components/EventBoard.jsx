import { useState } from "react";
import {
  closeEvent,
  createEvent,
  deleteEvent,
  downloadEventExport,
  firstError,
  openEvent,
} from "../lib/api";
import { inputClass } from "./ui";

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

const actionBtn =
  "h-9 rounded-lg border border-cream-dark bg-white px-3 text-xs font-semibold text-indaba-dark shadow-sm hover:border-gold hover:bg-gold-soft/40 disabled:opacity-40";

export function EventBoard({
  events,
  selectedId,
  onSelect,
  onRefresh,
  onError,
}) {
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [exportingId, setExportingId] = useState(null);

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
      onSelect(String(created.id));
    } catch (err) {
      onError(firstError(err.data) || "Could not add the event.");
    } finally {
      setSaving(false);
    }
  }

  async function run(eventId, action) {
    setBusyId(eventId);
    onError("");
    try {
      await action();
      await onRefresh();
    } catch (err) {
      onError(firstError(err.data) || "Could not update the event.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExport(item, clickEvent) {
    clickEvent.stopPropagation();
    setExportingId(item.id);
    onError("");
    try {
      await downloadEventExport(item);
    } catch {
      onError("Could not export this event CSV.");
    } finally {
      setExportingId(null);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-cream-dark bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink">Events</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Add a session, then enable registration when people should sign in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`h-9 rounded-lg px-3 text-xs font-semibold ${
            selectedId
              ? "border border-cream-dark bg-white text-indaba-dark hover:border-gold"
              : "bg-indaba text-white"
          }`}
        >
          All attendants
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_11rem_auto]"
      >
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event name, e.g. Weekly session"
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
        <button
          type="submit"
          disabled={saving}
          className="h-11 rounded-xl bg-indaba px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(15,122,74,0.25)] hover:bg-indaba-dark disabled:opacity-60"
        >
          {saving ? "Adding…" : "Add event"}
        </button>
      </form>

      {events.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream px-4 py-6 text-center text-sm text-ink-muted">
          No events yet. Add the first session to start taking attendance.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {events.map((item) => {
            const selected = String(item.id) === String(selectedId);
            const busy = busyId === item.id;
            return (
              <li key={item.id}>
                <article
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-gold bg-gold-soft/30 ring-2 ring-gold/40"
                      : "border-cream-dark bg-cream/40 hover:border-gold"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(String(item.id))}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{item.name}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                          {formatEventDate(item.event_date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
                          item.registration_open
                            ? "bg-indaba text-white"
                            : "bg-white text-ink-muted ring-1 ring-cream-dark"
                        }`}
                      >
                        {item.registration_open ? "Open" : "Closed"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-indaba-dark">
                      {item.attendance_count} registered
                    </p>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.registration_open ? (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          run(item.id, () => closeEvent(item.id));
                        }}
                      >
                        Disable registration
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={actionBtn}
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          run(item.id, () => openEvent(item.id));
                        }}
                      >
                        Enable registration
                      </button>
                    )}
                    <button
                      type="button"
                      className={actionBtn}
                      disabled={exportingId === item.id}
                      onClick={(e) => handleExport(item, e)}
                    >
                      {exportingId === item.id ? "Exporting…" : "Export event CSV"}
                    </button>
                    {item.attendance_count === 0 ? (
                      <button
                        type="button"
                        className={`${actionBtn} text-terracotta`}
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          run(item.id, async () => {
                            await deleteEvent(item.id);
                            if (String(selectedId) === String(item.id)) onSelect("");
                          });
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

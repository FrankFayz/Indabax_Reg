const PRODUCTION_API = "https://indabax-reg.onrender.com/api";

const API_BASE = import.meta.env.DEV ? "/api" : PRODUCTION_API;

function getToken() {
  return localStorage.getItem("indabax_token") || "";
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("indabax_token", token);
  } else {
    localStorage.removeItem("indabax_token");
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Token ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error("Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function fetchChoices() {
  return request("/choices/");
}

export function registerStudent(payload) {
  return request("/register/", { method: "POST", body: payload });
}

export function loginOrganizer(username, password) {
  return request("/auth/login/", {
    method: "POST",
    body: { username, password },
  });
}

export function fetchEvents() {
  return request("/events/", { auth: true });
}

export function createEvent(payload) {
  return request("/events/", { method: "POST", body: payload, auth: true });
}

export function openEvent(eventId) {
  return request(`/events/${eventId}/open/`, { method: "POST", auth: true });
}

export function closeEvent(eventId) {
  return request(`/events/${eventId}/close/`, { method: "POST", auth: true });
}

export function deleteEvent(eventId) {
  return request(`/events/${eventId}/`, { method: "DELETE", auth: true });
}

export function fetchRegistrants(search = "", faculty = "", page = 1, eventId = "") {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (faculty) params.set("faculty", faculty);
  if (eventId) params.set("event", String(eventId));
  params.set("page", String(page));
  return request(`/registrants/?${params.toString()}`, { auth: true });
}

export function fetchStats(eventId = "") {
  const params = new URLSearchParams();
  if (eventId) params.set("event", String(eventId));
  const query = params.toString();
  return request(`/registrants/stats/${query ? `?${query}` : ""}`, { auth: true });
}

async function downloadCsv(path, filename) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) {
    throw new Error("Could not download the attendance list.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadExport() {
  return downloadCsv("/registrants/export/", "indabax-kabale-attendance.csv");
}

export function downloadEventExport(event) {
  const date = event.event_date || "event";
  const slug = String(event.name || "event")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return downloadCsv(
    `/events/${event.id}/export/`,
    `indabax-kabale-${slug || "event"}-${date}.csv`
  );
}

export function firstError(errorData) {
  if (!errorData) return "Something went wrong. Please try again.";
  if (typeof errorData === "string") return errorData;
  if (errorData.detail) {
    const detail = errorData.detail;
    if (Array.isArray(detail)) return detail[0];
    if (typeof detail === "string") return detail;
  }
  const firstKey = Object.keys(errorData)[0];
  if (!firstKey) return "Please check the form and try again.";
  const value = errorData[firstKey];
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return "Please check the form and try again.";
}

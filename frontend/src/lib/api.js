const API_BASE = "/api";

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

export function fetchRegistrants(search = "", faculty = "") {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (faculty) params.set("faculty", faculty);
  const query = params.toString();
  return request(`/registrants/${query ? `?${query}` : ""}`, { auth: true });
}

export function fetchStats() {
  return request("/registrants/stats/", { auth: true });
}

export async function downloadExport() {
  const token = getToken();
  const response = await fetch(`${API_BASE}/registrants/export/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) {
    throw new Error("Could not download the attendance list.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "indabax-kabale-registrants.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function firstError(errorData) {
  if (!errorData) return "Something went wrong. Please try again.";
  if (typeof errorData === "string") return errorData;
  if (errorData.detail) return errorData.detail;
  const firstKey = Object.keys(errorData)[0];
  if (!firstKey) return "Please check the form and try again.";
  const value = errorData[firstKey];
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return "Please check the form and try again.";
}

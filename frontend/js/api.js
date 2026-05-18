const API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("access_token");
}

function setToken(token) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
}

function isLoggedIn() {
  return Boolean(getToken());
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (data) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data.message) {
        message = data.message;
      }
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function login(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const data = await apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  setToken(data.access_token);
  return data;
}

async function register(email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

async function fetchMe() {
  return apiRequest("/auth/me");
}

function logout() {
  clearToken();
  window.location.href = "login.html";
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

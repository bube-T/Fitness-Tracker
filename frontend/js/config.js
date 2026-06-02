// Auto-detects dev vs production.
// After deploying the backend to Render, replace the prod URL below with your actual service URL.
const _isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
window.API_BASE_URL = _isDev
  ? "http://127.0.0.1:3000"
  : "https://vitality-api.onrender.com";

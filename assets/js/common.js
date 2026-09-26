import { NEXUS_ENVIRONMENTS, DEFAULT_NEXUS_ENVIRONMENT } from "./config.js";

const STORAGE_KEY = "nexus-environment";

export function getSelectedEnvironmentId() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && NEXUS_ENVIRONMENTS.some((e) => e.id === stored)) return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through to default.
  }
  return DEFAULT_NEXUS_ENVIRONMENT;
}

export function getSelectedEnvironment() {
  const id = getSelectedEnvironmentId();
  return NEXUS_ENVIRONMENTS.find((e) => e.id === id) || NEXUS_ENVIRONMENTS[0];
}

function setSelectedEnvironmentId(id) {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Ignore — the dropdown still updates in-memory for this page view.
  }
}

// Renders the shared header (title + NEXUS environment dropdown) into the
// element with id="site-header", and wires up change handling. Call once per
// page load. `onEnvironmentChange` is invoked with the new environment id
// whenever the user picks a different one.
export function renderHeader({ onEnvironmentChange } = {}) {
  const host = document.getElementById("site-header");
  if (!host) return;

  const current = getSelectedEnvironmentId();
  const options = NEXUS_ENVIRONMENTS.map(
    (env) => `<option value="${env.id}" ${env.id === current ? "selected" : ""}>${env.label}</option>`
  ).join("");

  host.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="./index.html">Triveria NEXUS Workflows</a>
      <label class="env-picker">
        <span class="env-picker-label">NEXUS environment</span>
        <select id="env-select" aria-label="NEXUS environment">${options}</select>
      </label>
    </div>
  `;

  const select = document.getElementById("env-select");
  select.addEventListener("change", (event) => {
    const id = event.target.value;
    setSelectedEnvironmentId(id);
    if (typeof onEnvironmentChange === "function") onEnvironmentChange(id);
  });
}

let dataPromise;

export function loadWorkflowData() {
  if (!dataPromise) {
    dataPromise = fetch("./workflows/data.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load workflows/data.json (${res.status})`);
        return res.json();
      })
      .then((json) => json.workflows);
  }
  return dataPromise;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

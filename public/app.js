"use strict";

// These are approximate map centres for exploration, not evidence of dated historical features.
const VIEWS = Object.freeze({
  centre: { label: "Manchester city centre", lat: 53.4808, lng: -2.2426, zoom: 14, hint: "Look for streets, boundaries and buildings that appear, disappear or change." },
  castlefield: { label: "Castlefield", lat: 53.4752, lng: -2.2572, zoom: 14, hint: "Try comparing the area around the waterways and transport corridors." },
  ancoats: { label: "Ancoats", lat: 53.4839, lng: -2.2266, zoom: 14, hint: "Look for changes in street patterns and the built environment." },
  "northern-quarter": { label: "Northern Quarter", lat: 53.484, lng: -2.2372, zoom: 14, hint: "See which street details are available at different points in time." },
  piccadilly: { label: "Piccadilly", lat: 53.4773, lng: -2.2318, zoom: 14, hint: "Compare the transport landscape with the modern street network." }
});

const START_YEAR = 1600;
const END_YEAR = 2026;
const DEFAULT_YEAR = 1900;
let currentView = "centre";
let currentYear = DEFAULT_YEAR;

const historyFrame = document.getElementById("historical-map");
const modernFrame = document.getElementById("modern-map");
const historicalLink = document.getElementById("historical-link");
const modernLink = document.getElementById("modern-link");
const range = document.getElementById("year");
const yearOutput = document.getElementById("year-output");
const mapYear = document.getElementById("map-year");
const placeTitle = document.getElementById("place-title");
const placeHint = document.getElementById("place-hint");
const status = document.getElementById("map-status");
const share = document.getElementById("share");

function validYear(value) {
  const number = Number(value);
  if (!Number.isInteger(number)) return DEFAULT_YEAR;
  return Math.min(END_YEAR, Math.max(START_YEAR, number));
}

function validView(value) {
  return Object.prototype.hasOwnProperty.call(VIEWS, value) ? value : "centre";
}

function historyUrl(view, year) {
  // Official OpenHistoricalMap embed: #map=zoom/latitude/longitude&date=year&layer=O
  return "https://embed.openhistoricalmap.org/#map=" +
    view.zoom + "/" + view.lat + "/" + view.lng + "&date=" + year + "&layer=O";
}

function modernEmbedUrl(view) {
  // Official OSM embedded map, showing an approximate bounding box around the chosen centre.
  const bbox = [view.lng - 0.014, view.lat - 0.0065, view.lng + 0.014, view.lat + 0.0065]
    .map(n => n.toFixed(6)).join(",");
  return "https://www.openstreetmap.org/export/embed.html?bbox=" +
    encodeURIComponent(bbox) + "&layer=mapnik";
}

function modernPageUrl(view) {
  return "https://www.openstreetmap.org/#map=" +
    view.zoom + "/" + view.lat + "/" + view.lng;
}

function updateAddress() {
  const url = new URL(window.location.href);
  url.searchParams.set("view", currentView);
  url.searchParams.set("year", String(currentYear));
  window.history.replaceState({}, "", url);
}

function updateControls() {
  const view = VIEWS[currentView];
  range.value = String(currentYear);
  yearOutput.textContent = String(currentYear);
  mapYear.textContent = String(currentYear);
  placeTitle.textContent = view.label;
  placeHint.textContent = view.hint;

  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === currentView;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-year]").forEach(button => {
    const active = Number(button.dataset.year) === currentYear;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function render({ updateModern = false, updateUrl = true } = {}) {
  const view = VIEWS[currentView];
  const historical = historyUrl(view, currentYear);
  historyFrame.src = historical;
  historicalLink.href = historical;
  historyFrame.title = "OpenHistoricalMap historical view of " + view.label + " in " + currentYear;

  if (updateModern) {
    modernFrame.src = modernEmbedUrl(view);
  }
  modernFrame.title = "Present-day OpenStreetMap of " + view.label;
  modernLink.href = modernPageUrl(view);

  updateControls();
  if (updateUrl) updateAddress();
  status.textContent = "Maps set to " + view.label + " in " + currentYear +
    ". You can pan each map independently; date and feature coverage are not guaranteed.";
}

function chooseView(key) {
  const next = validView(key);
  if (next === currentView) return;
  currentView = next;
  render({ updateModern: true });
}

function chooseYear(year) {
  const next = validYear(year);
  if (next === currentYear) {
    updateControls();
    return;
  }
  currentYear = next;
  render();
}

function initialiseFromAddress() {
  const params = new URLSearchParams(window.location.search);
  currentView = validView(params.get("view"));
  currentYear = params.has("year") ? validYear(params.get("year")) : DEFAULT_YEAR;
  render({ updateModern: true, updateUrl: false });
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => chooseView(button.dataset.view));
});

document.querySelectorAll("[data-year]").forEach(button => {
  button.addEventListener("click", () => chooseYear(button.dataset.year));
});

// Preview the year while sliding, and reload only on release/commit to avoid excessive tile requests.
range.addEventListener("input", () => {
  yearOutput.textContent = range.value;
});
range.addEventListener("change", () => chooseYear(range.value));

share.addEventListener("click", async () => {
  updateAddress();
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard not supported");
    }
    await navigator.clipboard.writeText(window.location.href);
    status.textContent = "Share link copied. It will open with this viewpoint and year.";
  } catch (_error) {
    status.textContent = "Automatic copying is unavailable. Copy the current page address instead.";
  }
});

window.addEventListener("popstate", initialiseFromAddress);
initialiseFromAddress();
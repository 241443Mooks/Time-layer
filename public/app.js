"use strict";

// These are approximate map centres for exploration, not evidence of dated historical features.
const VIEWS = Object.freeze({
  centre: { label: "Manchester city centre", lat: 53.4808, lng: -2.2426, zoom: 14, hint: "Look for streets, boundaries and buildings that appear, disappear or change." },
  castlefield: { label: "Castlefield", lat: 53.4752, lng: -2.2572, zoom: 14, hint: "Try comparing the area around the waterways and transport corridors." },
  ancoats: { label: "Ancoats", lat: 53.4839, lng: -2.2266, zoom: 14, hint: "Look for changes in street patterns and the built environment." },
  "northern-quarter": { label: "Northern Quarter", lat: 53.484, lng: -2.2372, zoom: 14, hint: "See which street details are available at different points in time." },
  piccadilly: { label: "Piccadilly", lat: 53.4773, lng: -2.2318, zoom: 14, hint: "Compare the transport landscape with the modern street network." }
});

// OHM's date control covers approximately 4000 BCE onward; the year
// numbering below is astronomical: 0 = 1 BCE, -999 = 1000 BCE.
const START_YEAR = -3999;
const END_YEAR = 2026;
const DEFAULT_YEAR = 1900;
const ERAS = Object.freeze({
  ancient: { min: -3999, max: 0, defaultYear: -999 },
  early: { min: 1, max: 999, defaultYear: 79 },
  medieval: { min: 1000, max: 1599, defaultYear: 1200 },
  recent: { min: 1600, max: 2026, defaultYear: 1900 }
});

function eraForYear(year) {
  return Object.keys(ERAS).find(key => {
    const era = ERAS[key];
    return year >= era.min && year <= era.max;
  }) || "recent";
}

function formatYear(year) {
  return year <= 0 ? String(1 - year) + " BCE" : String(year) + " CE";
}

function historicalDate(year) {
  // OHM supports negative years. -0999 means 1000 BCE; 0000 means 1 BCE.
  if (year < 0) return "-" + String(Math.abs(year)).padStart(4, "0");
  if (year === 0) return "0000";
  return String(year);
}
let currentView = "centre";
let currentYear = DEFAULT_YEAR;
let customPlace = null;
const selectedPlaceName = document.getElementById("selected-place");

function currentMapView() {
  return customPlace || VIEWS[currentView];
}

function currentPlaceId() {
  if (customPlace) return customPlace.id;
  if (currentView === "centre") return "Q18125";
  if (currentView === "castlefield") return "Q2308772";
  return null;
}

const historyFrame = document.getElementById("historical-map");
const modernFrame = document.getElementById("modern-map");
const historicalLink = document.getElementById("historical-link");
const modernLink = document.getElementById("modern-link");
const range = document.getElementById("year");
const rangeStart = document.getElementById("range-start");
const rangeEnd = document.getElementById("range-end");
const yearOutput = document.getElementById("year-output");
const mapYear = document.getElementById("map-year");
const placeTitle = document.getElementById("place-title");
const placeHint = document.getElementById("place-hint");
const status = document.getElementById("map-status");
const share = document.getElementById("share");
const mapModeButtons = {
  historical: document.getElementById("map-mode-historical"),
  modern: document.getElementById("map-mode-modern")
};
const mapPanes = {
  historical: document.getElementById("historical-pane"),
  modern: document.getElementById("modern-pane")
};
let activeMap = "historical";

function setMapMode(mode) {
  if (mode !== "historical" && mode !== "modern") return;
  activeMap = mode;
  for (const [key, button] of Object.entries(mapModeButtons)) {
    const visible = key === mode;
    button.setAttribute("aria-pressed", String(visible));
    button.classList.toggle("is-active", visible);
    mapPanes[key].classList.toggle("is-visible", visible);
    const aligned = Boolean(document.getElementById("map-aligned-toggle")?.checked);
    // Both iframes must stay inaccessible when the shared renderer is active.
    mapPanes[key].setAttribute("aria-hidden", String(aligned || !visible));
    mapPanes[key].inert = aligned || !visible;
    const iframe = mapPanes[key].querySelector("iframe");
    if (iframe) iframe.tabIndex = aligned || !visible ? -1 : 0;
    const link = mapPanes[key].querySelector("a");
    if (link) link.tabIndex = aligned || !visible ? -1 : 0;
  }
  const aligned = Boolean(document.getElementById("map-aligned-toggle")?.checked);
  status.textContent = aligned
    ? "Shared map beta: flip between past and today at exactly the same camera position and zoom."
    : (mode === "historical"
      ? "Viewing historical reconstruction at " + formatYear(currentYear) + ". Flip to Today to compare. Maps do not sync after panning."
      : "Viewing today's reference map. Flip back to the reconstructed past. Maps do not sync after panning.");
}
Object.entries(mapModeButtons).forEach(([mode, button]) => {
  button.addEventListener("click", () => setMapMode(mode));
});

function validYear(value) {
  if (value === null || !/^-?\d+$/.test(String(value))) return DEFAULT_YEAR;
  const number = Number(value);
  if (!Number.isSafeInteger(number)) return DEFAULT_YEAR;
  return Math.min(END_YEAR, Math.max(START_YEAR, number));
}

function validView(value) {
  return Object.prototype.hasOwnProperty.call(VIEWS, value) ? value : "centre";
}

function historyUrl(view, year) {
  // Official OHM embed: negative years are supported (e.g. -0999 = 1000 BCE).
  return "https://embed.openhistoricalmap.org/#map=" +
    view.zoom + "/" + view.lat + "/" + view.lng + "&date=" + historicalDate(year) + "&layer=O";
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
  if (customPlace) {
    url.searchParams.set("place", customPlace.id);
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", currentView);
    url.searchParams.delete("place");
  }
  url.searchParams.set("year", String(currentYear));
  window.history.replaceState({}, "", url);
}

function updateControls() {
  const view = currentMapView();
  const eraKey = eraForYear(currentYear);
  const era = ERAS[eraKey];
  range.min = String(era.min);
  range.max = String(era.max);
  range.value = String(currentYear);
  rangeStart.textContent = formatYear(era.min);
  rangeEnd.textContent = formatYear(era.max);
  yearOutput.textContent = formatYear(currentYear);
  mapYear.textContent = formatYear(currentYear);
  document.querySelectorAll("[data-era]").forEach(button => {
    const active = button.dataset.era === eraKey;
    button.classList.toggle("is-selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
  placeTitle.textContent = view.label;
  placeHint.textContent = view.hint || "Compare the mapped past with modern streets. Location and date precision vary.";
  selectedPlaceName.textContent = view.label;

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
  const view = currentMapView();
  const historical = historyUrl(view, currentYear);
  historyFrame.src = historical;
  historicalLink.href = historical;
  historyFrame.title = "OpenHistoricalMap historical view of " + view.label + " in " + formatYear(currentYear);

  if (updateModern) {
    modernFrame.src = modernEmbedUrl(view);
  }
  modernFrame.title = "Present-day OpenStreetMap of " + view.label;
  modernLink.href = modernPageUrl(view);

  updateControls();
  setMapMode(activeMap);
  if (updateUrl) updateAddress();
  status.textContent = document.getElementById("map-aligned-toggle")?.checked
    ? "Shared map beta: " + view.label + " · " + formatYear(currentYear) +
      ". Pan or zoom, then flip to compare at the same position."
    : "Map centred on " + view.label + " for " + formatYear(currentYear) +
      ". Flip between historical reconstruction and today; the views do not synchronise after panning.";
  window.dispatchEvent(new CustomEvent("time-layer-selection", {
    detail: {
      view: customPlace ? "world" : currentView,
      placeId: currentPlaceId(),
      lat: view.lat,
      lng: view.lng,
      year: currentYear,
      label: view.label
    }
  }));
}

function chooseView(key) {
  const next = validView(key);
  if (next === currentView) return;
  currentView = next;
  customPlace = null;
  render({ updateModern: true });
}

function choosePlace(place) {
  if (!place || !/^Q[1-9]\d{0,11}$/.test(place.id) ||
      !Number.isFinite(place.lat) || !Number.isFinite(place.lng) ||
      place.lat < -85 || place.lat > 85 || place.lng < -180 || place.lng > 180) return;
  customPlace = {
    id: place.id,
    label: String(place.label || place.id).slice(0, 100),
    lat: Number(place.lat),
    lng: Number(place.lng),
    zoom: 14,
    hint: "Explore source-backed clues about this place; Wikidata coordinates are modern reference points."
  };
  currentView = "world";
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

function chooseEra(key) {
  if (!Object.prototype.hasOwnProperty.call(ERAS, key)) return;
  if (eraForYear(currentYear) === key) return;
  chooseYear(ERAS[key].defaultYear);
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

document.querySelectorAll("[data-era]").forEach(button => {
  button.addEventListener("click", () => chooseEra(button.dataset.era));
});

// Preview the year while sliding, and reload only on release/commit to avoid excessive tile requests.
range.addEventListener("input", () => {
  yearOutput.textContent = formatYear(Number(range.value));
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

window.addEventListener("time-layer-explore-place", event => {
  choosePlace(event.detail);
});

window.addEventListener("time-layer-set-year", event => {
  const year = event.detail && event.detail.year;
  if (Number.isInteger(year)) chooseYear(year);
});

window.addEventListener("popstate", () => {
  initialiseFromAddress();
  const params = new URLSearchParams(window.location.search);
  const placeId = params.get("place");
  if (placeId && /^Q[1-9]\d{0,11}$/.test(placeId)) {
    window.dispatchEvent(new CustomEvent("time-layer-restore-place", { detail: { id: placeId } }));
  }
});
initialiseFromAddress();
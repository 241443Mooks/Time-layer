"use strict";

// Opt-in single-camera map. Uses OHM's official time-aware MapLibre stylesheet
// and overlays modern OSM raster tiles on the SAME MapLibre map instance.
// Existing embedded maps remain the fallback until this works on mobile.
(() => {
  const toggle = document.getElementById("map-aligned-toggle");
  const stage = document.getElementById("map-stage");
  const host = document.getElementById("shared-map-host");
  const help = document.getElementById("map-aligned-help");
  const historic = document.getElementById("map-mode-historical");
  const modern = document.getElementById("map-mode-modern");
  if (!toggle || !stage || !host || !help || !historic || !modern) return;

  const MAPLIBRE = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.js";
  const MAPLIBRE_CSS = "https://cdn.jsdelivr.net/npm/maplibre-gl@5.6.0/dist/maplibre-gl.css";
  const DATES = "https://cdn.jsdelivr.net/npm/@openhistoricalmap/maplibre-gl-dates@2.0.0/index.js";
  const OHM_STYLE = "https://www.openhistoricalmap.org/map-styles/main/main.json";
  const OSM_RASTER = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const OSM_LAYER = "time-layer-modern-raster";

  let map = null;
  let ready = false;
  let loading = null;
  let selection = { lat: 53.4808, lng: -2.2426, year: 1900, view: "centre" };
  let lastPlace = null;
  let activeMode = "historical";
  let lastYear = null;

  function validSelection(detail) {
    return detail &&
      Number.isFinite(detail.lat) && Math.abs(detail.lat) <= 85 &&
      Number.isFinite(detail.lng) && Math.abs(detail.lng) <= 180 &&
      Number.isInteger(detail.year) && detail.year >= -3999 && detail.year <= 2026;
  }

  function historicalDate(year) {
    // Astronomical numbering used by the existing app and OHM embeds.
    if (year < 0) return "-" + String(Math.abs(year)).padStart(4, "0");
    return year === 0 ? "0000" : String(year);
  }

  function locationKey(data) {
    return data.placeId || data.view || String(data.lat) + "," + String(data.lng);
  }

  function status(message) {
    help.textContent = message;
  }

  function showShared() {
    host.hidden = false;
    stage.classList.add("is-shared");
    stage.querySelectorAll(".map-pane").forEach(pane => {
      pane.inert = true;
      pane.setAttribute("aria-hidden", "true");
    });
  }

  function showEmbeds() {
    host.hidden = true;
    stage.classList.remove("is-shared");
    // app.js maintains these panes' normal visibility.
    stage.querySelectorAll(".map-pane").forEach(pane => {
      const visible = pane.id === (activeMode === "historical" ? "historical-pane" : "modern-pane");
      pane.inert = !visible;
      pane.setAttribute("aria-hidden", String(!visible));
    });
  }

  function updateAddress() {
    const url = new URL(window.location.href);
    if (toggle.checked) url.searchParams.set("aligned", "1");
    else url.searchParams.delete("aligned");
    window.history.replaceState({}, "", url);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load a map dependency."));
      document.head.appendChild(script);
    });
  }

  async function loadDependencies() {
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }
    if (!window.maplibregl) await loadScript(MAPLIBRE);
    const library = window.maplibregl;
    // MapLibre GL v5's browser bundle does not expose a public
    // maplibregl.supported() function. On those builds, construction checks
    // WebGL support instead. Only call supported() when it actually exists.
    if (!library || typeof library.Map !== "function" ||
        (typeof library.supported === "function" && !library.supported())) {
      throw new Error("This browser cannot run the shared WebGL map.");
    }
    if (typeof window.maplibregl.Map.prototype.filterByDate !== "function") {
      await loadScript(DATES);
    }
    if (typeof window.maplibregl.Map.prototype.filterByDate !== "function") {
      throw new Error("Historical date filtering is unavailable.");
    }
  }

  function applyMode() {
    if (!ready || !map) return;
    map.setLayoutProperty(
      OSM_LAYER,
      "visibility",
      activeMode === "modern" ? "visible" : "none"
    );
    if (toggle.checked) {
      status(activeMode === "historical"
        ? "Aligned view · reconstructed past. Pan or zoom, then flip to Today without changing position."
        : "Aligned view · modern map. Pan or zoom, then flip to the past without changing position.");
    }
  }

  function syncSelection() {
    if (!ready || !map || !selection) return;
    const nextPlace = locationKey(selection);
    if (nextPlace !== lastPlace) {
      // Only a different PLACE re-centres the camera. Year changes and
      // flipping preserve the user's current pan, zoom, pitch and bearing.
      lastPlace = nextPlace;
      map.jumpTo({
        center: [selection.lng, selection.lat],
        zoom: 14,
        bearing: 0,
        pitch: 0
      });
    }
    if (lastYear !== selection.year) {
      map.filterByDate(historicalDate(selection.year));
      lastYear = selection.year;
    }
    applyMode();
  }

  async function createMap() {
    if (map) return;
    await loadDependencies();
    if (!toggle.checked) return;
    showShared();

    const maplibregl = window.maplibregl;
    map = new maplibregl.Map({
      container: "shared-map",
      style: OHM_STYLE,
      center: [selection.lng, selection.lat],
      zoom: 14,
      maxZoom: 19,
      attributionControl: {
        compact: true,
        customAttribution: [
          '<a href="https://www.openhistoricalmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenHistoricalMap</a>',
          '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        ]
      }
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.once("styledata", () => {
      // Filtering must be initialized before visualising the historical style.
      map.filterByDate(historicalDate(selection.year));
    });
    // If the stylesheet or its dependencies never finish loading, restore
    // the existing iframe map instead of leaving the user with a blank pane.
    await new Promise((resolve, reject) => {
      const watchdog = window.setTimeout(
        () => reject(new Error("The shared map did not load in time.")),
        18000
      );
      map.once("load", () => {
        window.clearTimeout(watchdog);
        try {
          map.addSource("time-layer-osm-tiles", {
            type: "raster",
            tiles: [OSM_RASTER],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors"
          });
          map.addLayer({
            id: OSM_LAYER,
            type: "raster",
            source: "time-layer-osm-tiles",
            layout: { visibility: "none" }
          });
          ready = true;
          syncSelection();
          if (toggle.checked) {
            window.requestAnimationFrame(() => map.resize());
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    }).catch(error => {
      if (map) map.remove();
      map = null;
      ready = false;
      lastPlace = null;
      lastYear = null;
      throw error;
    });
  }

  async function enable() {
    showShared();
    status("Loading the shared historical map…");
    try {
      if (!ready && !loading) loading = createMap();
      if (loading) {
        try {
          await loading;
        } finally {
          // A cancelled first attempt must not leave a resolved promise
          // blocking every subsequent tap of the switch.
          loading = null;
        }
      }
      if (!toggle.checked) {
        showEmbeds();
        return;
      }
      if (!ready || !map) {
        throw new Error("The shared map could not start. Please try again.");
      }
      showShared();
      window.requestAnimationFrame(() => map.resize());
      syncSelection();
      updateAddress();
    } catch (error) {
      // Leave the control usable and restore the known-working iframe view.
      // An explicit user cancellation shouldn't be presented as a failure.
      if (!toggle.checked) return;
      toggle.checked = false;
      showEmbeds();
      status((error && error.message ? error.message : "The shared map could not load.") +
        " Using the original map flip instead. You can retry the beta.");
      updateAddress();
    }
  }

  function disable() {
    showEmbeds();
    status("Original embeds active. They can pan independently; turn alignment on to share a camera.");
    updateAddress();
  }

  toggle.addEventListener("change", () => {
    if (toggle.checked) enable();
    else disable();
  });
  historic.addEventListener("click", () => {
    activeMode = "historical";
    applyMode();
  });
  modern.addEventListener("click", () => {
    activeMode = "modern";
    applyMode();
  });
  window.addEventListener("time-layer-selection", event => {
    if (!validSelection(event.detail)) return;
    selection = event.detail;
    syncSelection();
  });
  window.addEventListener("time-layer-map-revealed", () => {
    if (map && ready && toggle.checked) {
      window.requestAnimationFrame(() => map.resize());
    }
  });

  if (new URLSearchParams(window.location.search).get("aligned") === "1") {
    toggle.checked = true;
    enable();
  }
})();

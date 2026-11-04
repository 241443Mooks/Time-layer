"use strict";

// Explicit (not autocomplete) Wikimedia-powered place search and breadcrumb trail.
// Place descriptions/nearby articles are general context, NEVER proof for the
// historical year selected in the separate timeline.
(() => {
  const form = document.getElementById("place-search-form");
  const searchInput = document.getElementById("place-query");
  const searchStatus = document.getElementById("place-search-status");
  const results = document.getElementById("place-search-results");
  const discoveryStatus = document.getElementById("discovery-status");
  const title = document.getElementById("discovery-title");
  const description = document.getElementById("discovery-description");
  const summary = document.getElementById("discovery-summary");
  const wikipedia = document.getElementById("discovery-wikipedia");
  const wikidata = document.getElementById("discovery-wikidata");
  const nearby = document.getElementById("discovery-nearby");
  const connections = document.getElementById("discovery-connections");
  const connectionCount = document.getElementById("discovery-connection-count");
  const breadcrumbs = document.getElementById("discovery-breadcrumbs");
  const trailList = document.getElementById("discovery-trail");
  const sharedPlace = new URLSearchParams(window.location.search).get("place");
  const restoring = /^Q[1-9]\d{0,11}$/.test(sharedPlace || "");
  const cache = new Map();
  const trail = [];
  let currentId = null;
  let requestVersion = 0;
  let searchRequest = null;

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }

  function safePlace(place) {
    return place && /^Q[1-9]\d{0,11}$/.test(place.id) &&
      typeof place.label === "string" &&
      Number.isFinite(place.lat) && Math.abs(place.lat) <= 85 &&
      Number.isFinite(place.lng) && Math.abs(place.lng) <= 180;
  }

  function setLink(element, url) {
    if (typeof url === "string" && /^https:\/\/(?:www\.wikidata\.org|en\.wikipedia\.org)\//.test(url)) {
      element.href = url;
      element.hidden = false;
    } else {
      element.removeAttribute("href");
      element.hidden = true;
    }
  }

  function renderTrail() {
    trailList.replaceChildren();
    breadcrumbs.hidden = trail.length < 2;
    for (const [index, place] of trail.entries()) {
      const li = make("li");
      const button = make("button", index === trail.length - 1 ? "is-current" : "", place.label);
      button.type = "button";
      button.disabled = index === trail.length - 1;
      if (!button.disabled) {
        button.addEventListener("click", () => navigate(place, { trimAt: index }));
      }
      li.appendChild(button);
      trailList.appendChild(li);
    }
  }

  function remember(place, trimAt = null) {
    if (Number.isInteger(trimAt)) trail.splice(trimAt + 1);
    else if (trail[trail.length - 1]?.id !== place.id) {
      trail.push({ id: place.id, label: place.label, lat: place.lat, lng: place.lng });
      if (trail.length > 7) trail.shift();
    }
    renderTrail();
  }

  function renderConnections(list) {
    connections.replaceChildren();
    const seen = new Set();
    const items = Array.isArray(list) ? list.filter(place => {
      if (!safePlace(place) || seen.has(place.id) || place.id === currentId) return false;
      seen.add(place.id);
      return true;
    }) : [];
    connectionCount.textContent = items.length ? "(" + items.length + ")" : "(none available)";
    if (!items.length) {
      connections.appendChild(make("li", "discovery-empty", "No nearby source-linked articles were returned for this place."));
      return;
    }
    for (const place of items) {
      if (place.id === currentId) continue;
      const item = make("li");
      const button = make("button", "discovery-connection");
      button.type = "button";
      button.appendChild(make("strong", "", place.label));
      if (place.kind === "source-backed-lead") {
        button.appendChild(make("em", "discovery-researched", "Source-backed research lead"));
      }
      button.appendChild(make("span", "", place.description || "Nearby Wikipedia article"));
      button.addEventListener("click", () => {
        navigate(place);
        // Keep the destination and year visible; other connections are still available below.
        nearby.open = false;
      });
      item.appendChild(button);
      connections.appendChild(item);
    }
  }

  function displayDetail(data) {
    if (!data || !safePlace(data.place)) return;
    const place = data.place;
    title.textContent = place.label;
    description.textContent = place.description;
    summary.textContent = data.summary?.excerpt ||
      "No short English Wikipedia introduction is available for this place. Its Wikidata record may still have useful references.";
    setLink(wikidata, place.wikidataUrl);
    setLink(wikipedia, data.summary?.link);
    renderConnections([...(data.featured || []), ...(data.connections || [])]);
    discoveryStatus.textContent = "General historical and geographical context from Wikimedia. " +
      "These links are not filtered to your selected year." +
      (data.warnings?.length ? " Some sources are temporarily unavailable." : "");
  }

  async function loadDetail(id) {
    const version = ++requestVersion;
    if (cache.has(id)) { displayDetail(cache.get(id)); return cache.get(id); }
    discoveryStatus.textContent = "Looking for background and nearby historical connections…";
    summary.textContent = "";
    description.textContent = "";
    connections.replaceChildren();
    connectionCount.textContent = "";
    setLink(wikidata, null);
    setLink(wikipedia, null);
    try {
      const response = await fetch("/api/place?id=" + encodeURIComponent(id), {
        headers: { Accept: "application/json" }
      });
      const data = await response.json();
      if (!response.ok || !safePlace(data.place)) {
        throw new Error(data.error || "No source-linked place record available");
      }
      if (version !== requestVersion) return null;
      cache.set(id, data);
      if (cache.size > 15) cache.delete(cache.keys().next().value);
      displayDetail(data);
      return data;
    } catch (_error) {
      if (version !== requestVersion) return null;
      discoveryStatus.textContent = "Wikimedia context is unavailable right now. The maps and year controls still work.";
      return null;
    }
  }

  function navigate(place, options = {}) {
    if (!safePlace(place)) return;
    currentId = place.id;
    title.textContent = place.label;
    searchStatus.textContent = "";
    results.replaceChildren();
    remember(place, options.trimAt);
    if (!options.skipMap) {
      window.dispatchEvent(new CustomEvent("time-layer-explore-place", { detail: place }));
    }
    loadDetail(place.id);
  }

  async function openPlaceById(id) {
    if (!/^Q[1-9]\d{0,11}$/.test(id || "")) return;
    if (cache.has(id)) {
      navigate(cache.get(id).place);
      return;
    }
    searchStatus.textContent = "Locating your destination…";
    try {
      const response = await fetch("/api/place?id=" + encodeURIComponent(id));
      const data = await response.json();
      if (!response.ok || !safePlace(data.place)) throw new Error("Not a mapped place");
      cache.set(id, data);
      navigate(data.place);
    } catch (_error) {
      searchStatus.textContent = "Could not load this place right now. Try searching by its name.";
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query.length < 2 || query.length > 80) return;
    if (searchRequest) searchRequest.abort();
    const controller = new AbortController();
    searchRequest = controller;
    searchStatus.textContent = "Searching Wikidata for places named “" + query + "”…";
    results.replaceChildren();
    try {
      const response = await fetch("/api/place-search?q=" + encodeURIComponent(query), {
        signal: controller.signal, headers: { Accept: "application/json" }
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.results)) {
        throw new Error(data.error || "Search unavailable");
      }
      if (searchRequest !== controller) return;
      const matches = data.results.filter(safePlace);
      searchStatus.textContent = matches.length ?
        matches.length + " places found. Choose the right match:" :
        "No place with usable coordinates found. Try a different name or spelling.";
      for (const place of matches) {
        const li = make("li");
        const button = make("button", "place-search-result");
        button.type = "button";
        button.appendChild(make("strong", "", place.label));
        button.appendChild(make("span", "", place.description));
        button.addEventListener("click", () => navigate(place));
        li.appendChild(button);
        results.appendChild(li);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        searchStatus.textContent = "Place search is temporarily unavailable. Try Castlefield or Manchester.";
      }
    } finally {
      if (searchRequest === controller) searchRequest = null;
    }
  });

  document.querySelectorAll("[data-place-example]").forEach(button => {
    button.addEventListener("click", () => openPlaceById(button.dataset.placeExample));
  });

  window.addEventListener("time-layer-selection", event => {
    const selection = event.detail || {};
    if (restoring && selection.view !== "world" && !currentId) return;
    const id = selection.placeId;
    if (id && id !== currentId) {
      currentId = id;
      const place = {
        id,
        label: selection.label,
        lat: selection.lat,
        lng: selection.lng
      };
      if (safePlace(place)) {
        remember(place);
        loadDetail(id);
      }
    }
  });

  window.addEventListener("time-layer-restore-place", event => {
    openPlaceById(event.detail?.id);
  });

  // Old ?view=castlefield&year=79 links still work. New ?place=Q...&year=...
  // links resolve the Wikidata location before replacing the map viewpoint.
  if (restoring) openPlaceById(sharedPlace);
})();

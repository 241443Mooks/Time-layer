"use strict";

// Evidence inspection is independent of map iframe navigation.
// The OpenHistoricalMap records come from our same-origin, read-only Worker route.
(() => {
  const panel = document.getElementById("evidence-panel");
  const refresh = document.getElementById("evidence-refresh");
  const results = document.getElementById("evidence-results");
  const status = document.getElementById("evidence-status");
  const teaser = document.getElementById("evidence-teaser");
  const coverage = document.getElementById("evidence-coverage");
  const featuresList = document.getElementById("evidence-features");
  const featureSummary = document.getElementById("evidence-feature-summary");
  const eventsList = document.getElementById("evidence-events");
  const stats = {
    count: document.getElementById("evidence-count"),
    dated: document.getElementById("evidence-dated"),
    compatible: document.getElementById("evidence-compatible"),
    sourced: document.getElementById("evidence-sourced")
  };

  const cached = new Map();
  let selected = { view: "centre", year: 1900, label: "Manchester city centre" };
  let pending = null;
  let pendingKey = null;
  let requestId = 0;
  const WINDOW_YEARS = 25;

  function cacheKey(view, year, placeId) {
    return (placeId || view) + ":" + (Math.floor(year / WINDOW_YEARS) * WINDOW_YEARS);
  }

  function yearLabel(year) {
    return year <= 0 ? String(1 - year) + " BCE" : String(year) + " CE";
  }

  function parseExactYear(raw) {
    if (typeof raw !== "string") return null;
    // No approximate, uncertain, range or EDTF value gets coerced to an exact year.
    const match = /^(-?\d{1,4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(raw.trim());
    if (!match) return null;
    if (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 12)) return null;
    if (match[3] && (Number(match[3]) < 1 || Number(match[3]) > 31)) return null;
    return Number(match[1]);
  }

  function hasDateTag(tags) {
    return ["start_date", "end_date", "start_date:edtf", "end_date:edtf"]
      .some(key => Object.prototype.hasOwnProperty.call(tags, key));
  }

  function hasSource(tags) {
    return Object.keys(tags).some(key => key === "source" || key.startsWith("source:"));
  }

  function dateState(tags, year) {
    const start = parseExactYear(tags.start_date);
    const end = parseExactYear(tags.end_date);
    if (start !== null && year < start) return "before-start";
    if (end !== null && year > end) return "after-end";
    // An end-only record cannot establish that the feature had begun
    // by the chosen year (particularly important for BCE views).
    if (start === null || (tags.end_date && end === null)) return "unresolved";
    return "compatible";
  }

  function displayName(record) {
    const tags = record.tags || {};
    // Values such as building=yes are attributes, not names. Don't offer
    // fake discoveries labelled "yes", "primary", or "residential".
    const name = [tags["name:en"], tags.name, tags.old_name, tags.alt_name,
      tags["old_name:en"]].find(value =>
        typeof value === "string" && value.trim() &&
        !/^(yes|no|true|false|1|primary|residential)$/i.test(value.trim()));
    return name ? String(name).trim().slice(0, 100) : "Unnamed mapped feature";
  }

  function featureType(tags) {
    const fields = [
      ["historic", "Historic"], ["building", "Building"], ["amenity", "Amenity"],
      ["place", "Place"], ["railway", "Railway"], ["waterway", "Waterway"],
      ["landuse", "Land use"], ["natural", "Natural"], ["boundary", "Boundary"],
      ["highway", "Road"], ["shop", "Shop"], ["tourism", "Tourism"]
    ];
    const match = fields.find(([key]) => typeof tags[key] === "string" && tags[key]);
    if (!match) return "Type not recorded in this sample";
    return match[1] + ": " + String(tags[match[0]]).replaceAll("_", " ").slice(0, 90);
  }

  function recordUrl(record) {
    return "https://www.openhistoricalmap.org/" + record.type + "/" + record.id;
  }

  function sourceUrl(tags) {
    for (const key of ["source:url", "source:website"]) {
      try {
        const candidate = new URL(tags[key]);
        if (candidate.protocol === "https:" || candidate.protocol === "http:") {
          return candidate.href;
        }
      } catch (_error) { /* Source may be a citation, not a URL. */ }
    }
    return null;
  }

  function make(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = String(content);
    return element;
  }

  function emptyList(target, message) {
    target.replaceChildren();
    target.appendChild(make("li", "evidence-empty", message));
  }

  function rawDates(tags) {
    const dates = [];
    for (const [field, label] of [
      ["start_date", "Start"], ["end_date", "End"],
      ["start_date:edtf", "Start (EDTF)"], ["end_date:edtf", "End (EDTF)"]
    ]) {
      if (tags[field]) dates.push(label + ": " + String(tags[field]).slice(0, 70));
    }
    return dates.length ? dates.join(" · ") : "No date tags";
  }

  function features(records) {
    // The main list must never show records dated after (or ending before)
    // the selected year. Unresolved dates need a separate research view.
    return records.filter(record =>
      dateState(record.tags, selected.year) === "compatible" &&
      displayName(record) !== "Unnamed mapped feature")
      .sort((a, b) => {
        // Newest recorded start first; never use alphabetical order as the
        // primary sort for a historical timeline.
        const yearDifference = parseExactYear(b.tags.start_date) - parseExactYear(a.tags.start_date);
        if (yearDifference) return yearDifference;
        return displayName(a).localeCompare(displayName(b));
      }).slice(0, 8);
  }

  function renderFeature(record) {
    const item = make("li", "evidence-feature");
    const details = make("details", "evidence-feature-card");
    const head = make("summary", "evidence-feature-short");
    head.appendChild(make("strong", "", displayName(record)));
    head.appendChild(make("span", "evidence-feature-mini-date",
      "From " + (record.tags.start_date || "undated")));
    details.appendChild(head);

    const content = make("div", "evidence-feature-content");
    content.appendChild(make("p", "evidence-feature-type", featureType(record.tags)));
    content.appendChild(make("p", "evidence-feature-dates", rawDates(record.tags)));
    const cited = record.tags.source;
    if (cited) content.appendChild(make("p", "evidence-feature-source",
      "Source tag: " + String(cited).slice(0, 190)));
    const recordLink = make("a", "evidence-source-link", "View original OHM record ↗");
    recordLink.href = recordUrl(record);
    recordLink.target = "_blank";
    recordLink.rel = "noopener noreferrer";
    content.appendChild(recordLink);
    const src = sourceUrl(record.tags);
    if (src) {
      const sourceLink = make("a", "evidence-source-link", "Open cited source ↗");
      sourceLink.href = src;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      content.appendChild(sourceLink);
    }
    details.appendChild(content);
    item.appendChild(details);
    return item;
  }

  function datedEvents(records) {
    const events = [];
    records.forEach(record => {
      for (const [key, kind] of [["start_date", "Recorded start"], ["end_date", "Recorded end"]]) {
        const year = parseExactYear(record.tags[key]);
        if (year !== null && year >= -3999 && year <= 2026) {
          events.push({ year, kind, name: displayName(record) });
        }
      }
    });
    // Suppress generic and repeated values; use named source records for
    // jumping through time. A record is a clue, not necessarily an event.
    const seen = new Set();
    return events.filter(event => {
      if (event.year > selected.year || event.name === "Unnamed mapped feature") return false;
      const key = event.year + "|" + event.kind + "|" + event.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a,b) => b.year - a.year || a.name.localeCompare(b.name))
      .slice(0, 8);
  }

  function showRecords(payload) {
    const records = payload.elements.filter(record =>
      record && ["node", "way", "relation"].includes(record.type) &&
      Number.isSafeInteger(record.id) && record.tags && typeof record.tags === "object");
    const dated = records.filter(record => hasDateTag(record.tags)).length;
    const matching = records.filter(record => dateState(record.tags, selected.year) === "compatible");
    const unresolved = records.filter(record => dateState(record.tags, selected.year) === "unresolved").length;
    const sourced = matching.filter(record => hasSource(record.tags)).length;
    featureSummary.textContent = matching.length + " dated feature" +
      (matching.length === 1 ? "" : "s");
    stats.count.textContent = String(records.length);
    stats.dated.textContent = String(dated);
    stats.compatible.textContent = String(matching.length);
    stats.sourced.textContent = String(sourced);
    const windowText = Number.isInteger(payload.windowStart) && Number.isInteger(payload.windowEnd) ?
      "Search window: " + yearLabel(payload.windowStart) + "–" + yearLabel(payload.windowEnd) + ". " :
      "Legacy all-period sample. ";
    coverage.textContent = windowText +
      (payload.capped ? "This query reached its " + payload.limit + "-record cap, so some relevant records may be missing. " : "This remains a bounded and selective local query. ") +
      "Showing only features with date bounds compatible with " + yearLabel(selected.year) + ". " +
      unresolved + " returned records have unresolved dates and are not shown as matches. " +
      "A compatible date does not prove a feature existed in that year. " +
      "Listing/registration dates from other archives will not be treated as construction dates.";
    featuresList.replaceChildren();
    const namedFeatures = features(matching);
    if (matching.length === 0) {
      emptyList(featuresList,
        "No compatible features found in this limited historical sample.");
    } else if (!namedFeatures.length) {
      emptyList(featuresList,
        "Date-compatible records exist, but none has a useful place name in this sample.");
    } else {
      namedFeatures.forEach(record => featuresList.appendChild(renderFeature(record)));
    }
    eventsList.replaceChildren();
    const events = datedEvents(records);
    if (!events.length) {
      emptyList(eventsList, "No machine-readable changes dated on or before " + yearLabel(selected.year) + " were found in this sample.");
    } else {
      events.forEach(event => {
        const li = make("li", "evidence-event");
        const button = make("button", "evidence-jump", yearLabel(event.year));
        button.type = "button";
        button.addEventListener("click", () => {
          window.dispatchEvent(new CustomEvent("time-layer-set-year", { detail: { year: event.year } }));
        });
        li.appendChild(button);
        li.appendChild(make("span", "", event.kind + " · " + event.name));
        eventsList.appendChild(li);
      });
    }
    status.textContent = "Viewing " + selected.label + " in " + yearLabel(selected.year) +
      ": " + matching.length + " date-compatible feature" + (matching.length === 1 ? "" : "s") +
      " from " + records.length + " returned records" + (payload.capped ? " (sample limit reached)" : "") + ".";
    teaser.textContent = matching.length + " matches · " + yearLabel(selected.year);
    // Send a few date-only suggestions to the compact time strip. They are
    // explicitly identified as a limited OHM sample, not a full chronology.
    window.dispatchEvent(new CustomEvent("time-layer-pins", {
      detail: {
        key: selected.placeId || selected.view,
        year: selected.year,
        pins: events.filter(event => event.year < selected.year)
      }
    }));
    results.hidden = false;
  }

  async function load(force = false) {
    if (!panel.open) return;
    const view = selected.view;
    const year = selected.year;
    const key = cacheKey(view, year, selected.placeId);
    if (!force && cached.has(key)) {
      if (pending && pendingKey !== key) {
        pending.abort();
        requestId++;
        pending = null;
        pendingKey = null;
      }
      showRecords(cached.get(key));
      return;
    }
    if (pending && pendingKey === key && !force) return;
    if (pending) pending.abort();
    const controller = new AbortController();
    pending = controller;
    pendingKey = key;
    const thisRequest = ++requestId;
    refresh.disabled = true;
    results.hidden = true;
    status.textContent = "Checking nearby dated records around " + selected.label + "…";
    teaser.textContent = "Checking records…";
    try {
      const target = selected.placeId && view === "world" ?
        "place=" + encodeURIComponent(selected.placeId) :
        "view=" + encodeURIComponent(view);
      const response = await fetch("/api/evidence?" + target +
        "&year=" + encodeURIComponent(String(year)), {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const payload = await response.json();
      if (!response.ok || !payload || !Array.isArray(payload.elements) || payload.view !== view ||
          (view === "world" && payload.placeId !== selected.placeId)) {
        throw new Error((payload && payload.error) || "The evidence API returned an unexpected response.");
      }
      if (thisRequest !== requestId) return;
      cached.set(key, payload);
      // Bound memory use while exploring lots of historical periods.
      if (cached.size > 12) cached.delete(cached.keys().next().value);
      showRecords(payload);
    } catch (error) {
      if (thisRequest !== requestId) return;
      if (error.name === "AbortError") return;
      status.textContent = "Could not inspect the records: " + error.message + " The historical and modern maps still work.";
      teaser.textContent = "Evidence temporarily unavailable";
      results.hidden = true;
    } finally {
      if (thisRequest === requestId) {
        refresh.disabled = false;
        pending = null;
        pendingKey = null;
      }
    }
  }

  panel.addEventListener("toggle", () => {
    if (panel.open) load();
  });
  refresh.addEventListener("click", () => load(true));

  window.addEventListener("time-layer-selection", event => {
    const detail = event.detail;
    if (!detail || typeof detail.view !== "string" || !Number.isInteger(detail.year)) return;
    const previousView = selected.view;
    selected = detail;
    if (panel.open) {
      // Reuse the same 25-year window without another API call. Request
      // another narrow window only when the user travels outside it.
      load();
    } else {
      teaser.textContent = "Check records around " + selected.label + " · " + yearLabel(selected.year);
    }
  });
})();

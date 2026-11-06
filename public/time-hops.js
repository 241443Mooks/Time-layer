"use strict";

// Place-first time travel: small navigation instead of a page-long year form.
// Recorded event chips come only from the currently opened, bounded OHM
// evidence sample; no claim of an exhaustive local chronology.
(() => {
  const buttons = document.getElementById("time-hop-buttons");
  const events = document.getElementById("time-hop-events");
  const eventButtons = document.getElementById("time-hop-event-buttons");
  const find = document.getElementById("time-hop-find");
  const findStatus = document.getElementById("time-hop-find-status");
  const place = document.getElementById("hops-place");
  const label = document.getElementById("hops-year");
  if (!buttons || !events || !eventButtons || !place || !label || !find || !findStatus) return;

  let current = { year: 1900, placeId: null, view: "centre" };
  const START = -3999, END = 2026;
  const offsets = [-100, -25, 25, 100];

  function yearLabel(year) {
    return year <= 0 ? (1 - year) + " BCE" : year + " CE";
  }

  function jump(year) {
    if (!Number.isInteger(year) || year < START || year > END ||
        year === current.year) return;
    window.dispatchEvent(new CustomEvent("time-layer-set-year", { detail: { year } }));
  }

  function renderOffsets() {
    buttons.replaceChildren();
    for (const offset of offsets) {
      const year = current.year + offset;
      if (year < START || year > END) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time-hop-button";
      button.textContent = yearLabel(year);
      button.title = "Travel " + Math.abs(offset) + " years " +
        (offset < 0 ? "earlier" : "later") + " at this place";
      button.addEventListener("click", () => jump(year));
      buttons.appendChild(button);
    }
  }

  find.addEventListener("click", () => {
    find.disabled = true;
    findStatus.textContent = "Checking…";
    window.dispatchEvent(new CustomEvent("time-layer-request-pins", {
      detail: { key: current.placeId || current.view, year: current.year }
    }));
  });

  window.addEventListener("time-layer-selection", event => {
    const detail = event.detail;
    if (!detail || !Number.isInteger(detail.year)) return;
    const newKey = detail.placeId || detail.view;
    const oldKey = current.placeId || current.view;
    const changed = detail.year !== current.year || newKey !== oldKey;
    current = detail;
    place.textContent = detail.label || "This place";
    label.textContent = yearLabel(detail.year);
    renderOffsets();
    if (changed) {
      events.hidden = true;
      eventButtons.replaceChildren();
      find.disabled = false;
      findStatus.textContent = "";
    }
  });

  window.addEventListener("time-layer-pins", event => {
    const data = event.detail || {};
    const here = current.placeId || current.view;
    if (data.key !== here || data.year !== current.year) return;
    eventButtons.replaceChildren();
    const seen = new Set();
    const pins = Array.isArray(data.pins) ? data.pins : [];
    for (const pin of pins) {
      if (eventButtons.children.length >= 4) break;
      if (!Number.isInteger(pin.year) || pin.year > current.year ||
          pin.year < START || pin.year > END ||
          pin.year === current.year || typeof pin.name !== "string" ||
          !pin.name || seen.has(pin.year)) continue;
      seen.add(pin.year);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "time-hop-event";
      const date = document.createElement("strong");
      date.textContent = yearLabel(pin.year);
      const name = document.createElement("span");
      name.textContent = pin.name.slice(0, 55);
      button.appendChild(date);
      button.appendChild(name);
      button.title = "Recorded " + (pin.kind || "change") +
        " · " + pin.name + ". Date from a limited OHM sample.";
      button.addEventListener("click", () => jump(pin.year));
      eventButtons.appendChild(button);
    }
    events.hidden = eventButtons.children.length === 0;
    find.disabled = false;
    findStatus.textContent = events.hidden ?
      "No named dates found in this limited sample." : "";
  });

  window.addEventListener("time-layer-pins-error", event => {
    const detail = event.detail || {};
    if (detail.key !== (current.placeId || current.view) ||
        detail.year !== current.year) return;
    find.disabled = false;
    findStatus.textContent = "Dates unavailable. Try again.";
  });
})();

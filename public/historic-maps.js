"use strict";

// Exact-item original-map leads. Curated geographic IDs and item records are
// intentional: a directory URL or guessed coverage must NEVER be substituted
// for a verified historic map sheet. Expand only after item-level verification.
(() => {
  const root = document.getElementById("historical-map-match");
  const title = document.getElementById("historical-map-title");
  const context = document.getElementById("historical-map-context");
  const link = document.getElementById("historical-map-link");
  const credit = document.getElementById("historical-map-credit");
  if (!root || !title || !context || !link || !credit) return;

  const catalogue = Object.freeze([
    {
      placeIds: ["Q56739974"], // The historic bridge, NOT London Bridge station or the 1973 bridge.
      title: "Rocque’s Plan of London · sheet 2E",
      date: 1746,
      source: "The London Archives · London Picture Archive, record 33549",
      href: "https://www.londonpicturearchive.org.uk/view-item?i=30771",
      geographicEvidence: "The archive explicitly lists London Bridge, Borough High Street and the River Thames in the sheet coverage.",
      maxGapYears: 15
    }
  ]);

  function phrase(year, selected) {
    const difference = Math.abs(year - selected);
    return year === selected ? String(year) :
      String(year) + " · " + difference + " year" + (difference === 1 ? "" : "s") +
      (year > selected ? " after" : " before") + " your chosen year";
  }

  function update(detail) {
    root.hidden = true;
    link.removeAttribute("href");
    if (!detail || !Number.isInteger(detail.year)) return;
    const qid = detail.placeId;
    const entries = catalogue.filter(item =>
      item.placeIds.includes(qid) &&
      Math.abs(item.date - detail.year) <= item.maxGapYears
    ).sort((a, b) => Math.abs(a.date - detail.year) - Math.abs(b.date - detail.year));
    if (!entries.length) return; // Never show a generic directory link as a fallback.
    const map = entries[0];
    title.textContent = map.title;
    context.textContent = "Original map dated " + phrase(map.date, detail.year) + ". " +
      map.geographicEvidence + " It cannot be assumed to represent the selected year precisely.";
    link.href = map.href;
    credit.textContent = map.source + " · View the archive’s own rights and image-use conditions.";
    root.hidden = false;
  }

  window.addEventListener("time-layer-selection", event => update(event.detail));
})();

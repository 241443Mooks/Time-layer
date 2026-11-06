"use strict";

// Compact adaptive history explorer. Only verified, place-specific claims are
// presented as chronology. House "chapters" are clearly research methods,
// NOT events at a specific home.
(() => {
  const root = document.getElementById("history-explorer");
  if (!root) return;
  const status = document.getElementById("history-loading");
  const content = document.getElementById("history-content");
  const proofGrid = document.getElementById("history-proof-grid");
  const chapterArea = document.getElementById("history-chapters");
  const chapterTitle = document.getElementById("history-chapter-title");
  const chapterCount = document.getElementById("history-chapter-count");
  const heading = document.getElementById("history-heading");
  const description = document.getElementById("history-description");
  const caveat = document.getElementById("history-caveat");
  const homeDemo = document.getElementById("history-home-demo");
  const returnButton = document.getElementById("history-return");
  let selected = {placeId: null, year: 1900, label: "Manchester"};
  let demo = false;
  let activeHistory = null;
  let requestId = 0;
  const cache = new Map();

  function make(tag, name, text) {
    const el = document.createElement(tag);
    if (name) el.className = name;
    if (text !== undefined) el.textContent = String(text);
    return el;
  }
  function yearLabel(year) {
    return year <= 0 ? String(1 - year) + " BCE" : String(year) + " CE";
  }
  function safeSource(source) {
    if (!source || typeof source.title !== "string" ||
        typeof source.url !== "string") return false;
    try {
      const url = new URL(source.url);
      return url.protocol === "https:" &&
        ["www.hrp.org.uk", "historicengland.org.uk",
          "www.nationalarchives.gov.uk"].includes(url.hostname);
    } catch { return false; }
  }
  function sourceLink(source) {
    if (!safeSource(source)) return null;
    const link = make("a", "history-source", "Inspect the source ↗");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = source.title;
    return link;
  }
  function safeYear(value) {
    return Number.isInteger(value) && value >= -3999 && value <= 2026;
  }
  function isInChapter(chapter, year) {
    if (!safeYear(year) || !safeYear(chapter.start) ||
        !safeYear(chapter.end)) return false;
    return year >= chapter.start && year <= chapter.end;
  }
  function proof(label, record, fallback) {
    const card = make("article", "history-proof");
    card.appendChild(make("span", "history-proof-label", label));
    if (!record) {
      card.appendChild(make("strong", "history-proof-date", "Not established"));
      card.appendChild(make("p", "history-proof-text", fallback));
      return card;
    }
    card.appendChild(make("strong", "history-proof-date", record.label));
    card.appendChild(make("p", "history-proof-text", record.description));
    if (record.qualifier) card.appendChild(make("p", "history-proof-qualifier", record.qualifier));
    const link = sourceLink(record.source);
    if (link) card.appendChild(link);
    return card;
  }
  function chapterCard(item, index, research) {
    if (!item || typeof item.title !== "string" || typeof item.dateLabel !== "string") return null;
    const card = make("article", "history-chapter");
    card.dataset.chapterId = String(item.id || index);
    card.appendChild(make("span", "history-chapter-kind",
      (research ? "RESEARCH METHOD" : item.type || "HISTORICAL CHAPTER").toUpperCase()));
    const label = make("strong", "history-chapter-date", item.dateLabel);
    card.appendChild(label);
    card.appendChild(make("h4", "history-chapter-name", item.title));
    card.appendChild(make("p", "history-chapter-teaser", item.text || ""));
    const actions = make("div", "history-chapter-actions");
    if (!research && safeYear(item.jumpYear)) {
      const jump = make("button", "history-jump", "Travel to " + yearLabel(item.jumpYear));
      jump.type = "button";
      jump.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("time-layer-set-year",
          {detail: {year: item.jumpYear}}));
        // Remain on this section: reorient the person without a page refresh.
        root.scrollIntoView({block:"start", behavior:"smooth"});
      });
      actions.appendChild(jump);
    }
    const further = make("details", "history-chapter-detail");
    const summary = make("summary", "", research ? "Why check this?" : "Evidence and dating");
    further.appendChild(summary);
    further.appendChild(make("p", "", "Date refers to: " +
      (item.basis || "the period described in the source") + "."));
    const link = sourceLink(item.source);
    if (link) further.appendChild(link);
    actions.appendChild(further);
    card.appendChild(actions);
    return card;
  }
  function highlightYear() {
    const chapters = Array.isArray(activeHistory?.chapters) ? activeHistory.chapters : [];
    const cards = Array.from(chapterArea.children);
    for (const [i, chapter] of chapters.entries()) {
      if (!cards[i]) continue;
      const inPeriod = isInChapter(chapter, selected.year) &&
        activeHistory.profile !== "home-research-demo";
      cards[i].classList.toggle("is-in-period", inPeriod);
    }
  }
  function render(history) {
    activeHistory = history;
    const research = history?.profile === "home-research-demo";
    const verified = history?.profile === "landmark" &&
      history.status === "curated-pilot";
    heading.textContent = research ? "How would we investigate a house?" :
      verified ? "A history to explore" : "A history still to uncover";
    description.textContent = research ?
      "An anonymous research demonstration—not records about your own home." :
      verified ? "Earliest source-backed clues, then moments you can travel to." :
      "This place has not yet had a source-verified chronology assembled.";
    if (!research && !verified) {
      status.textContent = "No verified place-specific chronology here yet. Try the Tower example or the residential research route.";
      content.hidden = true;
      return;
    }
    status.textContent = "";
    content.hidden = false;
    proofGrid.replaceChildren();
    proofGrid.appendChild(proof("EARLIEST EVIDENCE FROM THIS SITE",
      history.earliestOnSite,
      "Not determined: an earlier land-use record would need checking."));
    proofGrid.appendChild(proof("EARLIEST EVIDENCE FOR THIS PLACE",
      history.earliestForPlace,
      research ? "No property or address has been researched in this demonstration." :
      "No documented construction date has been verified."));
    chapterArea.replaceChildren();
    const chapters = Array.isArray(history.chapters) ? history.chapters : [];
    for (const [index,item] of chapters.entries()) {
      const card = chapterCard(item, index, research);
      if (card) chapterArea.appendChild(card);
    }
    chapterTitle.textContent = research ? "Where we'd investigate" : "Travel through the chapters";
    chapterCount.textContent = String(chapters.length) +
      (research ? " research routes" : " sourced moments");
    caveat.textContent = history.statusNote || "";
    highlightYear();
  }

  async function load() {
    const id = demo ? "home" : selected.placeId;
    const request = ++requestId;
    returnButton.hidden = !demo;
    if (!demo && !/^Q[1-9]\d{0,11}$/.test(id || "")) {
      render({profile:"unresearched",status:"unknown"});
      return;
    }
    const key = demo ? "home" : "place:" + id;
    if (cache.has(key)) {render(cache.get(key)); return;}
    content.hidden = true;
    status.textContent = "Checking available sourced history…";
    try {
      const url = demo ? "/api/place-history?demo=home" :
        "/api/place-history?place=" + encodeURIComponent(id);
      const response = await fetch(url, {headers: {Accept:"application/json"}});
      const data = await response.json();
      if (!response.ok || !data || !Array.isArray(data.chapters)) {
        throw new Error("A history profile is unavailable.");
      }
      if (request !== requestId) return;
      cache.set(key,data);
      if (cache.size > 12) cache.delete(cache.keys().next().value);
      render(data);
    } catch (_) {
      if (request !== requestId) return;
      status.textContent = "Source history is unavailable right now. Place search, maps and time travel still work.";
      content.hidden = true;
    }
  }

  homeDemo.addEventListener("click", () => {
    demo = true;
    load();
    root.scrollIntoView({block:"start",behavior:"smooth"});
  });
  returnButton.addEventListener("click", () => {
    demo = false;
    load();
  });
  window.addEventListener("time-layer-selection", event => {
    const detail = event.detail || {};
    if (safeYear(detail.year)) selected.year = detail.year;
    if (detail.placeId !== selected.placeId) {
      selected.placeId = detail.placeId || null;
      selected.label = detail.label || "this place";
      demo = false;
      load();
    } else {
      highlightYear();
    }
  });
})();

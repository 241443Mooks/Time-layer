"use strict";

// One source, one small Castlefield pilot. Historic England's scheduling dates
// describe legal protection, NOT when a monument was built or occupied.
(() => {
  const panel = document.getElementById("heritage-panel");
  const status = document.getElementById("heritage-status");
  const list = document.getElementById("heritage-items");
  let activeView = null;
  let cached = null;
  let pending = null;

  function itemElement(item) {
    const li = document.createElement("li");
    li.className = "heritage-item";
    const link = document.createElement("a");
    link.textContent = item.name || "Scheduled monument";
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    li.appendChild(link);
    const detail = document.createElement("p");
    detail.textContent = "Official scheduled monument · NHLE " + item.id +
      (item.designationDate ? " · Legally scheduled: " + item.designationDate : " · Scheduling date not supplied");
    li.appendChild(detail);
    return li;
  }

  function render(data) {
    list.replaceChildren();
    const records = data.items.filter(item => item && Number.isSafeInteger(item.id) && typeof item.name === "string" &&
      typeof item.link === "string" && item.link.startsWith("https://historicengland.org.uk/listing/the-list/list-entry/"));
    for (const item of records) list.appendChild(itemElement(item));
    if (!records.length) {
      const li = document.createElement("li");
      li.textContent = "No scheduled monuments returned in this small query area; that does not mean no archaeological history exists.";
      list.appendChild(li);
    }
    status.textContent = records.length + " scheduled monument" + (records.length === 1 ? "" : "s") +
      " returned near Castlefield" + (data.capped ? " (limited sample)" : "") +
      ". Their ages have not been established for the year on your map.";
  }

  async function load() {
    if (!panel.open || activeView !== "castlefield") return;
    if (cached) { render(cached); return; }
    if (pending) return;
    const controller = new AbortController();
    pending = controller;
    status.textContent = "Checking Historic England for protected archaeological sites…";
    try {
      const response = await fetch("/api/heritage?view=castlefield", {
        headers: { Accept: "application/json" }, signal: controller.signal
      });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.items) || body.view !== "castlefield") {
        throw new Error(body.error || "Unexpected heritage response.");
      }
      if (controller.signal.aborted || activeView !== "castlefield") return;
      cached = body;
      render(body);
    } catch (error) {
      if (error.name !== "AbortError") {
        status.textContent = "The heritage lookup is unavailable right now. Your historical map and dated evidence still work.";
      }
    } finally {
      if (pending === controller) pending = null;
    }
  }

  panel.addEventListener("toggle", () => { if (panel.open) load(); });
  window.addEventListener("time-layer-selection", event => {
    const next = event.detail && event.detail.view;
    if (next !== "castlefield") {
      if (pending) pending.abort();
      panel.open = false;
      panel.hidden = true;
    } else {
      panel.hidden = false;
      if (panel.open) load();
    }
    activeView = next;
  });
})();

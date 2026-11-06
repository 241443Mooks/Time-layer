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
  const lead = document.getElementById("discovery-lead");
  const about = document.getElementById("discovery-about");
  const heroMedia = document.getElementById("discovery-media");
  const heroImage = document.getElementById("discovery-image");
  const heroCredit = document.getElementById("discovery-image-credit");
  const heroDate = document.getElementById("discovery-image-date");
  const heroSource = document.getElementById("discovery-image-source");
  const gallery = document.getElementById("discovery-gallery");
  const galleryContent = document.getElementById("discovery-gallery-content");
  const wikipedia = document.getElementById("discovery-wikipedia");
  const wikidata = document.getElementById("discovery-wikidata");
  const featuredTrail = document.getElementById("featured-trail");
  const featuredTrailContent = document.getElementById("featured-trail-content");
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
  let activeYear = Number(new URLSearchParams(window.location.search).get("year")) || 1900;
  let activeDetail = null;
  const periodMediaCache = new Map();
  let periodMedia = [];
  let mediaTimer = null;
  let mediaRequestSerial = 0;

  function dateGap(media) {
    const date = media?.created;
    if (!date || !Number.isInteger(date.start) || !Number.isInteger(date.end) ||
        date.end < date.start) return Infinity;
    if (date.precision === "century" || date.precision === "broad-range") {
      // Broad dating is an interval, never a fabricated year marker.
      return activeYear >= date.start && activeYear <= date.end ? 0 : Infinity;
    }
    if (date.end - date.start > 20) return Infinity;
    return activeYear < date.start ? date.start - activeYear :
      activeYear > date.end ? activeYear - date.end : 0;
  }

  function matchesChosenYear(media) {
    return safeMedia(media) && dateGap(media) <= 20;
  }

  function createdCaption(media) {
    const d = media.created;
    if (d.precision === "century") {
      return "Created sometime in the " + d.label + " (" +
        d.start + "–" + d.end + " CE) · precise year unknown";
    }
    if (d.precision === "broad-range" || d.precision === "range") {
      return "Created between " + d.start + " and " + d.end +
        " CE · precise year unknown";
    }
    const period = d.start === d.end ? String(d.start) : d.start + "–" + d.end;
    const relative = dateGap(media);
    const direction = activeYear < d.start ? "later" : activeYear > d.end ? "earlier" : "";
    return "Created " + (d.precision === "circa" ? "c. " : "") + period +
      (relative ? " · " + relative + " year" + (relative === 1 ? "" : "s") + " " + direction : " · chosen year");
  }

  function sortRelevant(candidates) {
    return candidates.filter(candidate => matchesChosenYear(candidate.media))
      .sort((a, b) => ((b.priority || 0) - dateGap(b.media) * 5 -
        (b.media.created.precision === "century" ? 45 :
          b.media.created.precision === "broad-range" ? 35 : 0)) -
        ((a.priority || 0) - dateGap(a.media) * 5 -
        (a.media.created.precision === "century" ? 45 :
          a.media.created.precision === "broad-range" ? 35 : 0))).slice(0, 3);
  }


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

  function safeMedia(media) {
    if (!media || typeof media !== "object" ||
        typeof media.thumbnail !== "string" || typeof media.filePage !== "string" ||
        typeof media.license !== "string") return false;
    try {
      const image = new URL(media.thumbnail);
      const source = new URL(media.filePage);
      return image.protocol === "https:" &&
        ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(image.hostname) &&
        source.origin === "https://commons.wikimedia.org" &&
        source.pathname.startsWith("/wiki/File:");
    } catch { return false; }
  }

  function concise(text) {
    if (typeof text !== "string") return "";
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= 155) return clean;
    const words = clean.slice(0, 155);
    const cut = words.lastIndexOf(" ");
    return words.slice(0, cut > 115 ? cut : 155) + "…";
  }

  function attributionText(media) {
    return (media.creator || "Creator shown in original file") +
      " · " + media.license;
  }

  function imageFigure(media, className, label) {
    if (!safeMedia(media)) return null;
    const figure = make("figure", className);
    const picture = make("img");
    picture.src = media.thumbnail;
    picture.alt = media.alt || "Wikimedia illustration related to " + label;
    picture.loading = "lazy";
    picture.decoding = "async";
    figure.appendChild(picture);
    const caption = make("figcaption");
    const info = make("span", "", attributionText(media));
    caption.appendChild(make("strong", "", createdCaption(media)));
    caption.appendChild(info);
    const fileLink = make("a", "", "Image rights ↗");
    fileLink.href = media.filePage;
    fileLink.target = "_blank";
    fileLink.rel = "noopener noreferrer";
    caption.appendChild(fileLink);
    figure.appendChild(caption);
    return figure;
  }

  function renderHero(media) {
    const eligible = matchesChosenYear(media);
    heroMedia.hidden = !eligible;
    if (!eligible) {
      heroImage.removeAttribute("src");
      heroDate.textContent = "";
      heroCredit.textContent = "";
      heroSource.removeAttribute("href");
      return;
    }
    heroImage.src = media.thumbnail;
    heroImage.alt = media.alt || "Wikimedia illustration of this place";
    heroDate.textContent = createdCaption(media);
    heroCredit.textContent = attributionText(media);
    heroSource.href = media.filePage;
  }

  function renderGallery(list) {
    galleryContent.replaceChildren();
    const pictured = Array.isArray(list) ?
      sortRelevant(list.filter(item => safePlace(item) && item.id !== currentId)
        .map(item => ({...item, priority: 35}))) : [];
    gallery.hidden = !pictured.length;
    for (const item of pictured) {
      const card = make("article", "discovery-visual-card");
      const button = make("button", "discovery-visual-button");
      button.type = "button";
      const image = make("img");
      image.src = item.media.thumbnail;
      image.alt = item.media.alt || "Related illustration";
      image.loading = "lazy";
      image.decoding = "async";
      button.appendChild(image);
      const caption = make("span", "discovery-visual-title", item.label);
      button.appendChild(caption);
      button.addEventListener("click", () => navigate(item));
      card.appendChild(button);
      card.appendChild(make("p", "discovery-visual-context",
        createdCaption(item.media) + " · Nearby subject; depiction not verified."));
      const credit = make("a", "discovery-visual-credit", attributionText(item.media) + " ↗");
      credit.href = item.media.filePage;
      credit.target = "_blank";
      credit.rel = "noopener noreferrer";
      card.appendChild(credit);
      galleryContent.appendChild(card);
    }
  }

  function renderFeatured(leads) {
    featuredTrailContent.replaceChildren();
    const lead = Array.isArray(leads) ? leads.find(item =>
      safePlace(item) && item.id !== currentId && item.kind === "source-backed-lead" &&
      (!Number.isInteger(item.periodStart) || activeYear >= item.periodStart) &&
      (!Number.isInteger(item.periodEnd) || activeYear <= item.periodEnd)) : null;
    featuredTrail.hidden = !lead;
    if (!lead) return;
    const button = make("button", "featured-trail-button");
    button.type = "button";
    const art = matchesChosenYear(lead.media) ?
      imageFigure(lead.media, "featured-trail-media", lead.label) : null;
    if (art) featuredTrailContent.appendChild(art);
    button.appendChild(make("strong", "", "Explore " + lead.label));
    button.appendChild(make("span", "", lead.description || "A documented connection worth investigating."));
    button.addEventListener("click", () => navigate(lead));
    featuredTrailContent.appendChild(button);
    if (lead.evidenceUrl === "https://en.wikipedia.org/wiki/Castlefield" ||
        lead.evidenceUrl === "https://www.wikidata.org/wiki/Q56739974") {
      const label = lead.evidenceUrl.includes("wikidata.org") ?
        "Explore the historical bridge's separate Wikidata record ↗" :
        "Why are these places connected? Read the source ↗";
      const link = make("a", "featured-trail-source", label);
      link.href = lead.evidenceUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      featuredTrailContent.appendChild(link);
    }
    featuredTrailContent.appendChild(make("p", "featured-trail-caveat",
      "A documented link, not a claim that the feature existed in your selected year."));
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
      if (place.kind === "source-backed-lead" &&
          place.evidenceUrl === "https://en.wikipedia.org/wiki/Castlefield") {
        const reference = make("a", "discovery-lead-source", "Why is this connected? View the source ↗");
        reference.href = place.evidenceUrl;
        reference.target = "_blank";
        reference.rel = "noopener noreferrer";
        item.appendChild(reference);
      }
      connections.appendChild(item);
    }
  }

  function renderMediaForYear() {
    if (!activeDetail || activeDetail.place.id !== currentId) return;
    const candidates = [];
    if (activeDetail.summary?.media)
      candidates.push({media: activeDetail.summary.media, priority: 120});
    for (const entry of periodMedia)
      candidates.push({media: entry.media, priority: 110, title: entry.title});
    const ranked = sortRelevant(candidates);
    renderHero(ranked[0]?.media);
    renderFeatured(activeDetail.featured);
    renderGallery(activeDetail.connections);
  }

  function schedulePeriodMedia() {
    if (!currentId || !activeDetail || activeDetail.place.id !== currentId) return;
    const id = currentId, year = activeYear;
    const key = id + ":" + year;
    if (mediaTimer) window.clearTimeout(mediaTimer);
    if (periodMediaCache.has(key)) {
      periodMedia = periodMediaCache.get(key);
      renderMediaForYear();
      return;
    }
    periodMedia = [];
    renderMediaForYear();
    const token = ++mediaRequestSerial;
    // Coalesce rapid slider moves rather than repeatedly searching Commons.
    mediaTimer = window.setTimeout(async () => {
      mediaTimer = null;
      try {
        const response = await fetch("/api/period-images?id=" + encodeURIComponent(id) +
          "&year=" + encodeURIComponent(String(year)), {
          headers: { Accept: "application/json" }
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.images)) return;
        periodMediaCache.set(key, data.images.slice(0, 3));
        if (periodMediaCache.size > 18)
          periodMediaCache.delete(periodMediaCache.keys().next().value);
        if (token !== mediaRequestSerial || currentId !== id || activeYear !== year) return;
        periodMedia = data.images.slice(0, 3);
        renderMediaForYear();
      } catch (_error) {
        // A missing archive search result should never obstruct place browsing.
      }
    }, 320);
  }

  function displayDetail(data) {
    if (!data || !safePlace(data.place)) return;
    const place = data.place;
    if (activeDetail && activeDetail.place.id !== place.id) periodMedia = [];
    title.textContent = place.label;
    description.textContent = place.description;
    const context = data.summary?.excerpt ||
      "No short English Wikipedia introduction is available for this place. Its Wikidata record may still have useful references.";
    lead.textContent = concise(context);
    summary.textContent = context;
    about.hidden = context.length <= 155;
    about.open = false;
    activeDetail = data;
    renderMediaForYear();
    setLink(wikidata, place.wikidataUrl);
    setLink(wikipedia, data.summary?.link);
    renderConnections(data.connections);
    schedulePeriodMedia();
    discoveryStatus.textContent = "Wikimedia context · place links may span different periods." +
      (data.warnings?.length ? " Some sources unavailable." : "");
  }

  async function loadDetail(id) {
    const version = ++requestVersion;
    if (cache.has(id)) { displayDetail(cache.get(id)); return cache.get(id); }
    discoveryStatus.textContent = "Looking for background and nearby historical connections…";
    summary.textContent = "";
    lead.textContent = "";
    about.hidden = true;
    periodMedia = [];
    activeDetail = null;
    if (mediaTimer) window.clearTimeout(mediaTimer);
    mediaRequestSerial++;
    renderHero(null);
    gallery.hidden = true;
    galleryContent.replaceChildren();
    description.textContent = "";
    connections.replaceChildren();
    connectionCount.textContent = "";
    featuredTrail.hidden = true;
    featuredTrailContent.replaceChildren();
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
    const nextYear = Number(selection.year);
    const yearChanged = Number.isInteger(nextYear) && nextYear !== activeYear;
    if (Number.isInteger(nextYear)) activeYear = nextYear;
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
    } else if (yearChanged && currentId && activeDetail) {
      schedulePeriodMedia();
    }
  });

  window.addEventListener("time-layer-restore-place", event => {
    openPlaceById(event.detail?.id);
  });

  // Old ?view=castlefield&year=79 links still work. New ?place=Q...&year=...
  // links resolve the Wikidata location before replacing the map viewpoint.
  if (restoring) openPlaceById(sharedPlace);
})();

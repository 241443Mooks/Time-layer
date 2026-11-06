import { placeSearch, placeDetail, periodImages, resolvePlace } from "./wiki.js";
import { placeHistory } from "./history.js";

// Read-only, bounded OpenHistoricalMap evidence proxy.
// Browsers have historically encountered CORS issues contacting OHM Overpass.
const OVERPASS = "https://overpass-api.openhistoricalmap.org/api/interpreter";
const VIEWPOINTS = Object.freeze({
  centre: [53.4808, -2.2426],
  castlefield: [53.4752, -2.2572],
  ancoats: [53.4839, -2.2266],
  "northern-quarter": [53.484, -2.2372],
  piccadilly: [53.4773, -2.2318]
});
const LIMIT = 150;
// Year-specific windows reduce historical sampling bias and avoid querying the
// Overpass service on every one-year slider movement.
// Historic England Scheduled Monuments pilot: Castlefield only, England only.
// List/SchedDate describes legal designation, never construction or occupation.
const NHLE_SCHEDULED = "https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/6/query";
const HERITAGE_BBOX = "-2.270,53.465,-2.245,53.487";
const HERITAGE_LIMIT = 12;

async function heritageResponse(request) {
  if (request.method !== "GET") {
    return json({ error: "Only GET is supported." }, 405);
  }
  const url = new URL(request.url);
  if (url.searchParams.get("view") !== "castlefield") {
    return json({ error: "Historic England heritage pilot currently covers Castlefield only." }, 400);
  }
  const endpoint = new URL(NHLE_SCHEDULED);
  for (const [key, value] of Object.entries({
    f: "json",
    where: "1=1",
    geometry: HERITAGE_BBOX,
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "ListEntry,Name,SchedDate,hyperlink",
    returnGeometry: "false",
    resultRecordCount: String(HERITAGE_LIMIT)
  })) endpoint.searchParams.set(key, value);
  try {
    const response = await fetch(endpoint.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return json({ error: "Historic England service temporarily unavailable." }, 502);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.features) || payload.error) {
      return json({ error: "Unexpected data from Historic England." }, 502);
    }
    const items = payload.features.slice(0, HERITAGE_LIMIT).map(feature => {
      const attr = feature.attributes || {};
      const id = Number(attr.ListEntry);
      if (!Number.isSafeInteger(id) || id < 1) return null;
      const value = typeof attr.Name === "string" ? attr.Name.trim() : "";
      const name = value ? value.slice(0, 180) : "Unnamed scheduled monument";
      const designationDate = Number.isFinite(attr.SchedDate) ?
        new Date(attr.SchedDate).toISOString().slice(0, 10) : null;
      return {
        id,
        name,
        link: "https://historicengland.org.uk/listing/the-list/list-entry/" + id,
        designationDate
      };
    }).filter(Boolean);
    return json({
      source: "Historic England · National Heritage List for England",
      view: "castlefield",
      kind: "scheduled-monument",
      scope: "Nearby legally protected sites; no historical year matching is claimed",
      retrieved: new Date().toISOString(),
      items,
      capped: Boolean(payload.exceededTransferLimit) || payload.features.length >= HERITAGE_LIMIT,
      limit: HERITAGE_LIMIT
    }, 200, 86400);
  } catch (_error) {
    return json({ error: "Historic England lookup timed out or is unavailable." }, 503);
  }
}

const WINDOW_YEARS = 25;
const FIRST_YEAR = -3999;
const LAST_YEAR = 2026;

function validHistoricalYear(raw) {
  if (typeof raw !== "string" || !/^-?\d{1,4}$/.test(raw)) return null;
  const year = Number(raw);
  return Number.isSafeInteger(year) && year >= FIRST_YEAR && year <= LAST_YEAR ? year : null;
}

function periodForYear(year) {
  const start = Math.floor(year / WINDOW_YEARS) * WINDOW_YEARS;
  return { start, end: Math.min(LAST_YEAR, start + WINDOW_YEARS - 1) };
}

function json(body, status = 200, maxAge = 0) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": maxAge ? "public, max-age=" + maxAge : "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

// ~1 km local research box. Not the independently pannable iframe viewport.
function bounds([lat, lon]) {
  return [lat - 0.0045, lon - 0.007, lat + 0.0045, lon + 0.007]
    .map(x => x.toFixed(6)).join(",");
}

function overpassQuery(bbox, period) {
  const shape = "(" + bbox + ")";
  const header = '[out:json][timeout:17][maxsize:8388608];';
  if (period) {
    // Official OHM Overpass QL supports numeric comparisons on date tags.
    // A 25-year interval is queried server-side BEFORE the result cap.
    // Strict client date parsing still decides whether a feature matches the
    // individual selected year; approximations are never asserted as exact.
    return header +
      'nwr["start_date"]' + shape +
      '(if:is_number(t["start_date"]) && number(t["start_date"]) <= ' + period.end +
      ' && (!is_tag("end_date") || (is_number(t["end_date"]) && number(t["end_date"]) >= ' + period.start + ')));' +
      'out center ' + LIMIT + ';';
  }
  // Backward compatible, all-period sample for old direct endpoint links.
  return header + '(' +
    'nwr["start_date"]' + shape + ';' +
    'nwr["end_date"]' + shape + ';' +
    'nwr["start_date:edtf"]' + shape + ';' +
    'nwr["end_date:edtf"]' + shape + ';' +
    'nwr["historic"]["name"]' + shape + ';' +
    ');out center ' + LIMIT + ';';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/place-search") return placeSearch(request);
    if (url.pathname === "/api/place") return placeDetail(request);
    if (url.pathname === "/api/place-history") return placeHistory(request);
    if (url.pathname === "/api/period-images") return periodImages(request);
    if (url.pathname === "/api/heritage") {
      return heritageResponse(request);
    }
    if (url.pathname !== "/api/evidence") {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "GET") {
      return json({ error: "Only GET is supported." }, 405);
    }
    const placeId = url.searchParams.get("place");
    const view = placeId ? "world" : url.searchParams.get("view");
    if (!placeId && (!view || !Object.prototype.hasOwnProperty.call(VIEWPOINTS, view))) {
      return json({ error: "Choose a supported preset or a Wikidata place." }, 400);
    }
    if (placeId && !/^Q[1-9]\d{0,11}$/.test(placeId)) {
      return json({ error: "Invalid place identifier." }, 400);
    }
    const suppliedYear = url.searchParams.get("year");
    const year = suppliedYear === null ? null : validHistoricalYear(suppliedYear);
    if (suppliedYear !== null && year === null) {
      return json({ error: "Year must be an integer from 3999 BCE through 2026 CE." }, 400);
    }
    const period = year === null ? null : periodForYear(year);
    let centre = placeId ? null : VIEWPOINTS[view];
    if (placeId) {
      try {
        const place = await resolvePlace(placeId);
        if (!place) return json({ error: "This place has no usable map coordinates." }, 404);
        centre = [place.lat, place.lng];
      } catch (_error) {
        return json({ error: "Wikidata coordinates are temporarily unavailable. The maps still work." }, 503);
      }
    }
    const bbox = bounds(centre);
    try {
      const response = await fetch(OVERPASS, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: new URLSearchParams({ data: overpassQuery(bbox, period) }).toString(),
        signal: AbortSignal.timeout(19000)
      });
      if (!response.ok) {
        return json({ error: "Historical records could not be retrieved right now.", kind: "upstream" }, 502);
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.elements)) {
        return json({ error: "The historical data service returned an unexpected response.", kind: "format" }, 502);
      }
      const elements = payload.elements.slice(0, LIMIT)
        .filter(element => ["node", "way", "relation"].includes(element.type) && Number.isSafeInteger(element.id))
        .map(element => ({
          type: element.type,
          id: element.id,
          tags: element.tags && typeof element.tags === "object" ? element.tags : {}
        }));
      return json({
        view,
        placeId: placeId || null,
        bbox,
        source: "OpenHistoricalMap Overpass API",
        queried: new Date().toISOString(),
        limit: LIMIT,
        capped: payload.elements.length >= LIMIT,
        sampling: period ? "date-window" : "all-dates-legacy",
        windowStart: period ? period.start : null,
        windowEnd: period ? period.end : null,
        elements
      }, 200, 300);
    } catch (_error) {
      return json({ error: "Historical records are unavailable or timed out. Maps still work.", kind: "network" }, 503);
    }
  }
};

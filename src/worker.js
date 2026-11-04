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

function overpassQuery(bbox) {
  // The limited results are not a representative or complete coverage sample.
  const shape = "(" + bbox + ")";
  return '[out:json][timeout:17][maxsize:8388608];(' +
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
    if (url.pathname !== "/api/evidence") {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== "GET") {
      return json({ error: "Only GET is supported." }, 405);
    }
    const view = url.searchParams.get("view");
    if (!view || !Object.prototype.hasOwnProperty.call(VIEWPOINTS, view)) {
      return json({ error: "Choose one of the five supported Manchester viewpoints." }, 400);
    }
    const bbox = bounds(VIEWPOINTS[view]);
    try {
      const response = await fetch(OVERPASS, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: new URLSearchParams({ data: overpassQuery(bbox) }).toString(),
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
        bbox,
        source: "OpenHistoricalMap Overpass API",
        queried: new Date().toISOString(),
        limit: LIMIT,
        capped: payload.elements.length >= LIMIT,
        elements
      }, 200, 300);
    } catch (_error) {
      return json({ error: "Historical records are unavailable or timed out. Maps still work.", kind: "network" }, 503);
    }
  }
};

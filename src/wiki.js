// Wikidata-backed location discovery with Wikipedia summaries and nearby articles.
// Queries only Wikimedia endpoints, with bounded results and explicit user actions.
// Wikidata coordinates are modern reference points, not historical georeferencing.
const WIKIDATA = "https://www.wikidata.org/w/api.php";
const WIKIPEDIA = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "Time-Layer/0.3 (https://github.com/241443Mooks/Time-layer)";
const QID = /^Q[1-9]\d{0,11}$/;
const UPSTREAM_TIMEOUT_MS = 10000;

function json(body, status = 200, maxAge = 0) {
  return Response.json(body, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": maxAge ? "public, max-age=" + maxAge : "no-store"
    }
  });
}

function urlFor(base, params) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

async function fetchJson(url, timeout = UPSTREAM_TIMEOUT_MS) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT
    },
    signal: AbortSignal.timeout(timeout)
  });
  if (!response.ok) throw new Error("Wikimedia data service unavailable (HTTP " + response.status + ")");
  const body = await response.json();
  if (!body || typeof body !== "object" || body.error) throw new Error("Wikimedia response was unavailable.");
  return body;
}

async function entityBatch(ids, properties = "labels|descriptions|claims|sitelinks") {
  if (!ids.length) return {};
  const data = await fetchJson(urlFor(WIKIDATA, {
    action: "wbgetentities", ids: ids.join("|"), format: "json",
    languages: "en", props: properties, sitefilter: "enwiki"
  }));
  return data.entities || {};
}

function coordinates(entity) {
  if (!entity || !entity.claims || !Array.isArray(entity.claims.P625)) return null;
  const claim = entity.claims.P625.find(item =>
    item.rank !== "deprecated" && item.mainsnak?.datavalue?.value);
  const pos = claim?.mainsnak?.datavalue?.value;
  if (!pos || !Number.isFinite(pos.latitude) || !Number.isFinite(pos.longitude)) return null;
  if (pos.latitude < -85 || pos.latitude > 85 || pos.longitude < -180 || pos.longitude > 180) return null;
  if (pos.globe && !pos.globe.endsWith("/Q2")) return null;
  return {
    lat: Number(pos.latitude.toFixed(6)),
    lng: Number(pos.longitude.toFixed(6))
  };
}

function compactEntity(id, entity) {
  const coord = coordinates(entity);
  if (!coord) return null;
  const title = entity.sitelinks?.enwiki?.title;
  return {
    id,
    label: (entity.labels?.en?.value || id).slice(0, 110),
    description: (entity.descriptions?.en?.value || "Historical and geographical context not specified").slice(0, 220),
    lat: coord.lat,
    lng: coord.lng,
    article: typeof title === "string" ? title.slice(0, 180) : null,
    wikidataUrl: "https://www.wikidata.org/wiki/" + id
  };
}

export async function resolvePlace(id) {
  if (!QID.test(id || "")) return null;
  const entities = await entityBatch([id]);
  return compactEntity(id, entities[id]);
}

export async function placeSearch(request) {
  if (request.method !== "GET") return json({ error: "Only GET is supported." }, 405);
  const search = new URL(request.url).searchParams.get("q")?.trim() || "";
  if (search.length < 2 || search.length > 80) {
    return json({ error: "Enter a place name between 2 and 80 characters." }, 400);
  }
  try {
    const found = await fetchJson(urlFor(WIKIDATA, {
      action: "wbsearchentities", search, language: "en", uselang: "en",
      type: "item", limit: 16, format: "json"
    }));
    const ids = (found.search || []).map(item => item.id).filter(id => QID.test(id)).slice(0, 16);
    const entities = await entityBatch(ids);
    const results = ids.map(id => compactEntity(id, entities[id])).filter(Boolean).slice(0, 7);
    return json({ query: search, results, note: "Places with Wikidata coordinates; coverage and precision vary." }, 200, 600);
  } catch (_error) {
    return json({ error: "Place search is temporarily unavailable. Try again or use the Castlefield example." }, 503);
  }
}

function wikiArticleUrl(title) {
  return "https://en.wikipedia.org/wiki/" + encodeURIComponent(title.replaceAll(" ", "_"));
}

async function wikipediaSummary(title) {
  if (!title) return null;
  const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replaceAll(" ", "_"));
  const data = await fetchJson(url);
  if (data.type === "disambiguation") return null;
  return {
    title: (data.title || title).slice(0, 180),
    excerpt: typeof data.extract === "string" ? data.extract.slice(0, 950) : "",
    link: wikiArticleUrl(title)
  };
}

async function nearbyWikipedia(lat, lng, id) {
  const data = await fetchJson(urlFor(WIKIPEDIA, {
    action: "query", generator: "geosearch",
    ggscoord: lat + "|" + lng, ggsradius: 3500, ggslimit: 20,
    prop: "coordinates|pageprops|description|pageimages",
    piprop: "name|thumbnail", pithumbsize: 500, pilicense: "free",
    format: "json"
  }));
  const pages = Object.values(data.query?.pages || {});
  return pages.filter(page => {
    const loc = page.coordinates?.[0];
    return QID.test(page.pageprops?.wikibase_item || "") &&
      page.pageprops.wikibase_item !== id &&
      loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon) &&
      loc.lat >= -85 && loc.lat <= 85 && loc.lon >= -180 && loc.lon <= 180;
  }).slice(0, 9).map(page => ({
    id: page.pageprops.wikibase_item,
    label: String(page.title || "Nearby place").slice(0, 140),
    description: String(page.description || page.pageprops?.["wikibase-shortdesc"] || "Nearby Wikipedia article").slice(0, 200),
    lat: Number(page.coordinates[0].lat.toFixed(6)),
    lng: Number(page.coordinates[0].lon.toFixed(6)),
    articleUrl: wikiArticleUrl(page.title),
    imageFilename: typeof page.pageimage === "string" ? page.pageimage : null,
    imageThumbUrl: page.thumbnail?.source || null
  }));
}

// A tiny, explicitly source-backed research trail to prove the concept.
// This is NOT an automatically inferred historical relationship.
async function researchedTrail(id) {
  if (id !== "Q2308772") return [];
  const fort = await resolvePlace("Q3285089");
  if (!fort) return [];
  return [{
    ...fort,
    kind: "source-backed-lead",
    description: "The Castlefield Wikipedia article identifies this Roman fort at the site. Check the fort's own archaeology and dating.",
    evidenceUrl: "https://en.wikipedia.org/wiki/Castlefield"
  }];
}

// Real photos and artwork add visual richness, but individual file licences
// must be checked. Keep requests bounded and do not display unverified media.
const COMMONS = "https://commons.wikimedia.org/w/api.php";

function htmlPlain(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ").trim().slice(0, 160);
}

function wikipediaImageUrl(src) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" &&
      ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(url.hostname);
  } catch { return false; }
}

async function findArticleImages(titles) {
  const chosen = [...new Set(titles.filter(Boolean))].slice(0, 2);
  if (!chosen.length) return {};
  const response = await fetchJson(urlFor(WIKIPEDIA, {
    action: "query", titles: chosen.join("|"), prop: "pageimages",
    piprop: "name|thumbnail", pithumbsize: 560,
    pilicense: "free", format: "json"
  }));
  const images = {};
  for (const page of Object.values(response.query?.pages || {})) {
    if (page.pageimage && wikipediaImageUrl(page.thumbnail?.source)) {
      images[page.title] = {
        filename: page.pageimage,
        thumbnail: page.thumbnail.source
      };
    }
  }
  return images;
}

function fileKey(filename) {
  return String(filename || "").replace(/_/g, " ").normalize("NFC").toLowerCase();
}

function imageMetadata(page) {
  const file = page?.imageinfo?.[0];
  const meta = file?.extmetadata || {};
  const license = htmlPlain(meta.LicenseShortName?.value);
  // Don't assume a thumbnail is reusable just because a Wikipedia API
  // returned it. Require an explicitly open/public-domain media licence.
  if (!/^(CC0|CC BY(?:-SA)?(?: |$)|public domain|PD(?: |-|$))/i.test(license)) return null;
  const filePage = file?.descriptionurl;
  if (typeof filePage !== "string" ||
      !filePage.startsWith("https://commons.wikimedia.org/wiki/File:")) return null;
  const creator = htmlPlain(meta.Attribution?.value || meta.Artist?.value);
  const licenseUrl = meta.LicenseUrl?.value;
  return {
    filePage,
    creator: creator || "See the original file for creator credit",
    license,
    licenseUrl: typeof licenseUrl === "string" &&
      /^https:\/\/(?:creativecommons\.org|www\.creativecommons\.org)\//.test(licenseUrl)
        ? licenseUrl : null
  };
}

async function attachVerifiedMedia(place, summary, featured, near) {
  const titles = [place.article, featured[0]?.article].filter(Boolean);
  const selected = await findArticleImages(titles);
  const requests = [];
  const main = selected[place.article];
  if (main) requests.push({ subject: summary, filename: main.filename, url: main.thumbnail });
  const feature = featured[0];
  const featureImage = feature && selected[feature.article];
  if (featureImage) requests.push({ subject: feature, filename: featureImage.filename, url: featureImage.thumbnail });
  for (const item of near.slice(0, 7)) {
    if (item.imageFilename && wikipediaImageUrl(item.imageThumbUrl)) {
      requests.push({ subject: item, filename: item.imageFilename, url: item.imageThumbUrl });
    }
  }
  const chosen = requests.filter(x => wikipediaImageUrl(x.url)).slice(0, 8);
  if (!chosen.length) return;
  const names = [...new Set(chosen.map(x => x.filename))];
  const data = await fetchJson(urlFor(COMMONS, {
    action: "query", titles: names.map(x => "File:" + x).join("|"),
    prop: "imageinfo", iiprop: "url|extmetadata", format: "json"
  }));
  const byName = {};
  for (const page of Object.values(data.query?.pages || {})) {
    const key = fileKey(page.title.replace(/^File:/i, ""));
    byName[key] = imageMetadata(page);
  }
  for (const request of chosen) {
    const info = byName[fileKey(request.filename)];
    if (info) {
      request.subject.media = {
        thumbnail: request.url,
        alt: "Illustration from Wikimedia Commons related to " + (request.subject.label || request.subject.title || place.label),
        ...info,
        caveat: "Image creation date not established; not necessarily a view from the chosen year."
      };
    }
  }
}

export async function placeDetail(request) {
  if (request.method !== "GET") return json({ error: "Only GET is supported." }, 405);
  const id = new URL(request.url).searchParams.get("id");
  if (!QID.test(id || "")) return json({ error: "Choose a valid Wikidata place identifier." }, 400);
  try {
    const place = await resolvePlace(id);
    if (!place) return json({ error: "No usable coordinates exist for this Wikidata item." }, 404);
    const [summaryResult, nearbyResult, trailResult] = await Promise.allSettled([
      wikipediaSummary(place.article),
      nearbyWikipedia(place.lat, place.lng, id),
      researchedTrail(id)
    ]);
    const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
    const connections = nearbyResult.status === "fulfilled" ? nearbyResult.value : [];
    const featured = trailResult.status === "fulfilled" ? trailResult.value : [];
    try {
      if (summary) await attachVerifiedMedia(place, summary, featured, connections);
    } catch (_mediaError) {
      // Never fail the historical discovery just because Commons metadata is down.
    }
    // Do not expose unlicensed, unverified thumbnail URLs.
    const safeConnections = connections.map(({imageFilename, imageThumbUrl, ...rest}) => rest);
    return json({
      place,
      summary,
      connections: safeConnections,
      featured,
      warnings: [
        ...(summaryResult.status !== "fulfilled" ? ["Wikipedia introduction unavailable"] : []),
        ...(nearbyResult.status !== "fulfilled" ? ["Nearby Wikipedia articles unavailable"] : [])
      ],
      context: "General place information; not evidence that a listed place existed in the selected year.",
      source: "Wikidata (CC0) and Wikipedia (CC BY-SA, source attribution and licence apply)"
    }, 200, 900);
  } catch (_error) {
    return json({ error: "Could not retrieve this place from Wikidata right now." }, 503);
  }
}

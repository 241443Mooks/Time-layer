# Time-Layer Explorer

A small, source-led time traveller's atlas: **choose a place, choose a year, compare then and now, and follow a trail of historical evidence and nearby discoveries.** Worldwide place lookup is powered by Wikidata; historical coverage still varies greatly by location and period.

[Source radar entry OL-033](https://github.com/241443Mooks/Open-license-radar/blob/main/data/experiments.csv)

## Status

**Live deployment (4 November 2026):** [time-layer.corneliuslobster.workers.dev](https://time-layer.corneliuslobster.workers.dev/). The new destination-first HTML and the Wikimedia-backed place search, place profile, place-specific OHM evidence and Castlefield's curated Mamucium research lead were all observed via the live service. Focused mocked interaction checks passed search → select Castlefield → choose 79 CE → follow Mamucium → retain the year and breadcrumb trail. **Real-device mobile usability and full browser interaction have not yet been independently verified.** This remains an exploratory build, not a historical authority. The date-filtered OHM map is a reconstruction, **not** a scanned map originally drawn in that year.

## Current experience — place first, time second

1. Search for a place **worldwide** using Wikidata, select an item with usable coordinates, or try Castlefield and Manchester.
2. Choose a year between approximately 4000 BCE and 2026 CE.
3. Compare date-filtered OpenHistoricalMap and present-day OpenStreetMap, both centred on the selected location.
4. Read Wikidata/Wikipedia general context, then explore an optional **linked-place discovery trail**. Followed places keep the same year; breadcrumb buttons take you back.
5. Inspect the separate, collapsed **year-matched OHM evidence panel**; Castlefield also offers the official Historic England Scheduled Monuments pilot.

The five original Manchester viewpoint URLs, including `?view=centre&year=1678`, remain backward-compatible, but are no longer the main location picker. New place links look like `?place=Q2308772&year=79`.

**Research question:** Can a visitor travel somewhere new, investigate one sourced clue, follow a meaningful link, and return without losing their place and year?

### What the time-travel comparison does

- Two independent, interactive map embeds side by side (stacked on phones).
- Official [OpenHistoricalMap embed](https://github.com/OpenHistoricalMap/openhistoricalmap-embed), filtered by selected year, and the official [OpenStreetMap embed](https://wiki.openstreetmap.org/wiki/Export) for present-day comparison.
- Worldwide Wikidata place search and shareable `?place=Q…&year=…` links, four historical-period controls (4000 BCE–1 BCE, 1–999 CE, 1000–1599 CE, 1600–2026 CE), a year slider and optional collapsed date shortcuts. Previously shared Manchester-view URLs remain compatible.
- BCE date formatting follows OpenHistoricalMap's astronomical year convention: `year=-999` in this site's URL shows **1000 BCE** and is passed as `date=-0999` to the embed; `year=0` means **1 BCE**, not an invented year zero. These are **date selections**, not claims of feature coverage.
- No accounts, analytics, scraped map screenshots or external map keys. The new evidence panel uses a minimal Cloudflare Worker as a read-only proxy to the OHM Overpass API.

### Version 0.2 — What do we know here?

**Live evidence API verified 4 November 2026.** A collapsed-by-default **Historical evidence** section now sits **after the maps and place-discovery panel**. On demand, the panel:

- Calls a same-origin **`GET /api/evidence?view=centre&year=1678`** Worker endpoint, which performs a bounded, read-only query to [OpenHistoricalMap Overpass](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Overpass). The server filters by a **25-year window before the 150-record limit**, then the browser checks the selected year precisely. This makes older results less likely to be displaced by recent ones, but **does not** establish completeness. The public service may still time out or reject requests. Old requests without `year` remain supported as legacy broad samples.
- Queries a bounded ~1 km area around the **chosen place's Wikidata coordinate** (or a legacy Manchester preset), not whichever part of the independently pannable maps the visitor is currently looking at. Returns up to **150** historical elements after the 25-year period filter. This is a selective, potentially capped sample—not proof of completeness.
- Shows total records checked, records with date tags, records whose **interpretable start/end year bounds are compatible** with the selected year, and source tags **among matching records**. The main feature list contains **only date-compatible results**, not later structures (e.g. Ardwick Bridge in a 1000 BCE view). A machine-readable start year is required before a feature is shown as a match, and known end bounds are respected; end-only, unparseable, approximate-only and undated records remain unresolved rather than presumed ancient. Nonmatching/undated features are not silently presented as present in that year. The presence of a source tag does not independently establish reliability.
- Offers original-feature links and source links where tags include a valid URL; displays date text verbatim and treats unparseable/approximate/EDTF expressions as **unresolved**, not invented precise events.
- Shows up to eight nearby record starts/ends **on or before the selected year** that you can jump to. Later dates are suppressed. These are dates **attached to returned features**, not a comprehensive historical-events timeline.
- Caches up to twelve viewpoint-and-25-year-window responses across the browser session; moving the year slider within a retrieved period updates the panel locally, while crossing into another period triggers a new query only if the evidence panel is open. Press **Check records again** to refresh.
- Handles zero results and failed/timed-out queries explicitly. The maps continue working when the evidence service is unavailable. On phones, the panel is collapsed until requested; a fuller mobile layout redesign is deferred.

**Interpretation rule:** *No record returned* ≠ *Nothing existed*. *Compatible date tags* ≠ *Confirmed existence on that date*. The current iframe map layer may contain features absent from this narrow query.

The Worker accepts five old named presets or a validated Wikidata QID; coordinates are retrieved from Wikidata rather than trusting arbitrary client coordinates. Every Overpass query has fixed small bounds, a 150-record cap and a timeout. The app does not store or modify Wikimedia or OHM source data.

### Version 0.3 — Worldwide place discovery and a first rabbit hole

**Live endpoints checked 4 November 2026:** Outside the UK, `/api/place-search?q=Kyoto` returned Kyoto Q34600 (35.011611, 135.768111), and `/api/place?id=Q34600` returned a Wikipedia summary and nine nearby article links. This confirms international place discovery, **not** the completeness of historical Japanese map features.

- `GET /api/place-search?q=Castlefield`: explicit user-submitted search through [Wikidata's Action API](https://www.wikidata.org/wiki/Wikidata:Data_access); the site searches at most 16 candidate entities and displays up to seven with usable coordinates. There is **no autocomplete** or unbounded geocoding. Place labels and coordinates are CC0 Wikidata metadata.
- `GET /api/place?id=Q2308772`: a Wikidata place profile, an English [Wikipedia REST summary](https://www.mediawiki.org/wiki/Wikimedia_REST_API) if available, and up to nine geographically nearby Wikipedia articles with Wikidata identifiers and coordinates. Nearby articles are not time-filtered and may refer to modern places. Sources and their reuse attribution are shown.
- `GET /api/evidence?place=Q2308772&year=79`: a separate OHM historical query for the **selected place** rather than only the original five Manchester presets; the year-window response was verified live.
- One deliberately **curated, source-backed** first link connects [Castlefield](https://en.wikipedia.org/wiki/Castlefield) to [Mamucium](https://en.wikipedia.org/wiki/Mamucium), the former Roman fort. The connection follows Castlefield's Wikipedia account; a linked article does not prove that the fort or any other feature was present in the precise year selected. The relation is explicitly distinguished from generic nearby Wikipedia articles.
- In-browser breadcrumb navigation preserves the visitor's year when they choose a new place. The place summary and nearby articles provide **general context, not year-specific evidence**.

**Interaction test (simulated DOM, not a live-device test):** Search Castlefield → select Q2308772 → change to 79 CE → follow Mamucium Q3285089 → keep 79 CE in the shareable URL; breadcrumb trail preserves Manchester → Castlefield → Mamucium. All checks passed.

Wikimedia has [2026 API usage limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits). Calls are identified, bounded, user-triggered or made on selected place changes, and responses are cacheable for a short period. A popular public release would require stronger server-side caching/quotas and an operational review. **Wikidata search is a place-entry mechanism, not comprehensive global geocoding.**

### Intentional limits

- **Panning/zooming the two embeds is independent.** Choosing a viewpoint recentres both, but dragging one does not automatically drag the other. This is a first test of the idea, not yet a fully synchronised map engine.
- Historical coverage and date precision vary, especially for ancient and medieval Manchester. The software supports dates as far back as about 4000 BCE, but there may be very little (or nothing) mapped at a particular place or year. A missing shape on the older map **does not establish** that a place or building did not exist.
- Documentation: [OpenHistoricalMap browsing and historical date range](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Browsing), [embed year/negative-year syntax](https://github.com/OpenHistoricalMap/openhistoricalmap-embed), [BCE year conversion](https://forum.openhistoricalmap.org/t/ring-in-the-new-year-with-rails-dates-and-more/91).
- OpenHistoricalMap data is community-contributed and may contain individual features under rights different from CC0.
- Modern map tiles are provided through OpenStreetMap's own embedded map. Do not treat OSMF infrastructure as an unrestricted/high-volume or commercial tile CDN.
- No historical facts or five site-specific changes have been claimed without verifying records.

## Run locally

Serve the 'public' folder over HTTP, for example:

```bash
python3 -m http.server 8000 --directory public
```

Open http://localhost:8000. Live map embeds need an internet connection. Opening the HTML file directly may also work, but local HTTP is recommended.

## Deploy to Cloudflare Workers Static Assets

This project uses a minimal 'wrangler.toml' with the static assets directory set to './public'. From the repository root:

```bash
npx wrangler deploy
```

Or use Cloudflare's GitHub-connected deployment with **Build command: none**, **Deploy command: npx wrangler deploy**, and **Root directory: /**. Configure your Cloudflare account/permissions there. **A public deployment already exists, user-confirmed above.** GitHub commits may trigger Cloudflare automatic redeployment if configured; verify the new date controls appear on the live site rather than assuming the redeployment succeeded.

## Next checks and deliberate scope boundaries

1. Test live **mobile UX** end-to-end: search places, distinguish duplicate names, choose an era and year, inspect the historic/modern maps, follow the Mamucium lead and use the breadcrumb trail. Test opening a shared `?place=Q...&year=...` URL.
2. Find and corroborate **five date-bound OpenHistoricalMap features**, including cases with EDTF/approximate tags; validate source and `license=*` references. The current 150-element cap and strict year parsing still omit some potential evidence.
3. Test one real Roman fort record against Historic England and an archaeology source so the time-specific evidence view can state something genuinely supported, without replacing the source with a Wikipedia summary.
4. If the interaction proves worthwhile, replace the independent iframes with directly controlled [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) maps and the [OHM date-filtering plugin](https://github.com/OpenHistoricalMap/maplibre-gl-dates) for synchronised panning, map-click exploration and better mobile navigation.
5. Consider a licensed historical map scan/overlay only when the rights, tile usage and georeferencing are understood.

## First heritage enrichment: Historic England (Castlefield pilot)

**Live route confirmed 4 November 2026:** `GET /api/heritage?view=castlefield` returns officially protected Scheduled Monuments in a small fixed area. Its first result is [Remains of eastern wall of the Roman fort (NHLE 1001953)](https://historicengland.org.uk/listing/the-list/list-entry/1001953).

Inside the main evidence panel, Castlefield now offers a separately collapsible **Protected heritage nearby** section. It is fetched only on opening, is limited to a dozen records, and is **not** mixed into the selected-year matches. The historical map remains usable if Historic England is unavailable.

Historic England's [NHLE Scheduled Monuments API](https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/) is England-only and published under the **Open Government Licence**. Attribution includes Historic England and relevant Crown/Ordnance Survey notices. Legal scheduling dates are **not** when a monument was constructed or occupied; the first retrieved record did not supply a scheduling date.

See the [evidence-layer plan](docs/evidence-layers.md) for the verified pilot and next tasks. Wider coverage, matching official site ages to historical years, archaeological reports, and a scanned-map overlay are **not yet implemented**.

## Rights and operating costs

- [OpenHistoricalMap rights](https://www.openhistoricalmap.org/copyright): generally CC0, **some features are CC BY or CC BY-SA**. Check the actual features and sources. The OHM-provided embedded map is not the same as redistributing independent third-party historical images.
- [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing) structured facts/coordinates: CC0. [English Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:Copyrights) article text: CC BY-SA; link and attribute the source. Nearby pages and background are not year-matched archaeological evidence.
- [OpenStreetMap attribution / ODbL](https://www.openstreetmap.org/copyright), [tile use policy](https://operations.osmfoundation.org/policies/tiles/): keep required credit visible; external map infrastructure has fair-use limits.
- [OHM embed repository](https://github.com/OpenHistoricalMap/openhistoricalmap-embed): the project provides date, location and layer URL controls and an embeddable map.
- The project's own original code has **no outbound software licence selected yet**. Do not add one without a conscious decision.

This is a small public-repository experiment, not a finished product or proof of a business opportunity.

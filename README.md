# Time-Layer Explorer

A tiny, curiosity-led experiment: **look at the same part of Manchester today and at a selected point in the past.** Move through time; pick a viewpoint; see what the available historical mapping actually shows.

[Source radar entry OL-033](https://github.com/241443Mooks/Open-license-radar/blob/main/data/experiments.csv)

## Status

**Live deployment (user-confirmed 4 November 2026):** [time-layer.corneliuslobster.workers.dev](https://time-layer.corneliuslobster.workers.dev/). The owner has explored the initial map and reported it interesting but somewhat clunky. The expanded year controls and new evidence-panel markup have now been observed on the deployed page, and the live `/api/evidence?view=centre` endpoint returned actual OHM records on 4 November 2026. The result hit the 150-record cap. Interactive panel behaviour on a real mobile/desktop browser, error states and historical interpretation still require hands-on testing. This is an exploratory build, not a published historical reference. A year choice controls which records OpenHistoricalMap renders; it **does not** select a georeferenced scan of a map actually drawn in that year.

## First experiment (deliberately small)

Start at Manchester city centre. Choose among five *viewpoints to investigate* (city centre, Castlefield, Ancoats, Northern Quarter, and Piccadilly). Compare the modern view and the OpenHistoricalMap historical view. Move a year slider and observe changes.

**Research question:** Can a visitor find and describe one interesting, verifiable difference in about two minutes?

**Not yet established:** whether the chosen sites have sufficient mapped historical coverage, whether views line up closely enough for meaningful comparisons, or whether visitors find the experience compelling. The five view presets are **not** five verified historical events.

### What the time-travel comparison does

- Two independent, interactive map embeds side by side (stacked on phones).
- Official [OpenHistoricalMap embed](https://github.com/OpenHistoricalMap/openhistoricalmap-embed), filtered by selected year, and the official [OpenStreetMap embed](https://wiki.openstreetmap.org/wiki/Export) for present-day comparison.
- Five Manchester viewpoint presets, four historical-period controls (4000 BCE–1 BCE, 1–999 CE, 1000–1599 CE, 1600–2026 CE), a year slider within each period, quick jumps (including Roman-era 79 CE), links to open each source, and shareable URL parameters. Previously shared links such as `?view=centre&year=1678` remain compatible.
- BCE date formatting follows OpenHistoricalMap's astronomical year convention: `year=-999` in this site's URL shows **1000 BCE** and is passed as `date=-0999` to the embed; `year=0` means **1 BCE**, not an invented year zero. These are **date selections**, not claims of feature coverage.
- No accounts, analytics, scraped map screenshots or external map keys. The new evidence panel uses a minimal Cloudflare Worker as a read-only proxy to the OHM Overpass API.

### Version 0.2 — What do we know here?

**Deployed page and evidence endpoint confirmed 4 November 2026; interactive behaviour not fully validated.** A collapsed-by-default **Historical evidence** section sits between the timeline controls and the maps, so the time-travel experience remains primary. On demand, the panel:

- Calls a same-origin **`GET /api/evidence?view=centre`** Worker endpoint, which performs a bounded, read-only query to [OpenHistoricalMap Overpass](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Overpass). This avoids historical browser CORS difficulties; the public service may still time out or reject requests.
- Queries a fixed ~1 km area around the **chosen Manchester preset**, not the part of either map that has been panned. Returns up to **150** dated or named historic map features. This is a **biased limited selection**, never a measure of all mapped features or completeness.
- Shows total records checked, records with date tags, records whose **interpretable start/end year bounds are compatible** with the selected year, and source tags **among matching records**. The main feature list contains **only date-compatible results**, not later structures (e.g. Ardwick Bridge in a 1000 BCE view). Nonmatching/undated features are not silently presented as present in that year. The presence of a source tag does not independently establish reliability.
- Offers original-feature links and source links where tags include a valid URL; displays date text verbatim and treats unparseable/approximate/EDTF expressions as **unresolved**, not invented precise events.
- Shows up to eight nearby record starts/ends **on or before the selected year** that you can jump to. Later dates are suppressed. These are dates **attached to returned features**, not a comprehensive historical-events timeline.
- Caches the bounded records per viewpoint in the browser session; moving the year slider updates the panel locally with no new API request. Press **Check records again** to refresh.
- Handles zero results and failed/timed-out queries explicitly. The maps continue working when the evidence service is unavailable. On phones, the panel is collapsed until requested; a fuller mobile layout redesign is deferred.

**Interpretation rule:** *No record returned* ≠ *Nothing existed*. *Compatible date tags* ≠ *Confirmed existence on that date*. The current iframe map layer may contain features absent from this narrow query.

The Worker route is restricted to the five named presets, with fixed small bounds and a capped result count to limit third-party API load. It does not store or modify source data.

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

## A sensible next step — only after testing

1. After Cloudflare redeploys, check the site in a desktop and mobile browser: the map embeds, date controls, **Historical evidence** toggle, and `/api/evidence?view=castlefield` (a JSON response or a clear upstream error). Test 1678 CE, 79 CE, and a BCE year. Confirm that moving the slider filters cached evidence without new network requests.
2. Find **five specific OpenHistoricalMap features** with verifiable historical time bounds and original-feature links; check any `license=*` tags before describing/reusing them.
3. If the idea proves interesting, replace the iframes with directly controlled [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) maps and the [OHM date-filtering plugin](https://github.com/OpenHistoricalMap/maplibre-gl-dates) for truly synchronised viewports and immediate date updates.
4. Add a small evidence trail for each verified historical discovery: feature ID, date bounds, provenance, rights, and limitations.

## Next evidence layer: one official heritage source

The next proposed addition is **Historic England's National Heritage List for England**, beginning with Scheduled Monuments (Roman remains, archaeological sites, castles and other protected locations), followed only if useful by listed-building points. The data is official, England-only and licensed under the OGL, with required Historic England and Crown/OS attribution.

Crucially, legal **scheduling/listing dates are not construction or occupation dates**. The heritage layer must be explicitly separated from records compatible with a chosen year until each site's historical period can be independently established.

See [the evidence-layer research and staged implementation plan](docs/evidence-layers.md). **This second API is researched, not yet integrated.** The mobile evidence panel stays collapsed while we test usefulness and reduce scrolling.

## Rights and operating costs

- [OpenHistoricalMap rights](https://www.openhistoricalmap.org/copyright): generally CC0, **some features are CC BY or CC BY-SA**. Check the actual features and sources. The OHM-provided embedded map is not the same as redistributing independent third-party historical images.
- [OpenStreetMap attribution / ODbL](https://www.openstreetmap.org/copyright), [tile use policy](https://operations.osmfoundation.org/policies/tiles/): keep required credit visible; external map infrastructure has fair-use limits.
- [OHM embed repository](https://github.com/OpenHistoricalMap/openhistoricalmap-embed): the project provides date, location and layer URL controls and an embeddable map.
- The project's own original code has **no outbound software licence selected yet**. Do not add one without a conscious decision.

This is a small public-repository experiment, not a finished product or proof of a business opportunity.

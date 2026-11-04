# Time-Layer Explorer

A tiny, curiosity-led experiment: **look at the same part of Manchester today and at a selected point in the past.** Move through time; pick a viewpoint; see what the available historical mapping actually shows.

[Source radar entry OL-033](https://github.com/241443Mooks/Open-license-radar/blob/main/data/experiments.csv)

## Status

**Live deployment (user-confirmed 4 November 2026):** [time-layer.corneliuslobster.workers.dev](https://time-layer.corneliuslobster.workers.dev/). The owner has explored the initial map and reported it interesting but somewhat clunky. The expanded year controls committed on 4 November have not yet been independently browser-checked or confirmed deployed. This is an exploratory build, not a published historical reference. A year choice controls which records OpenHistoricalMap renders; it **does not** select a georeferenced scan of a map actually drawn in that year.

## First experiment (deliberately small)

Start at Manchester city centre. Choose among five *viewpoints to investigate* (city centre, Castlefield, Ancoats, Northern Quarter, and Piccadilly). Compare the modern view and the OpenHistoricalMap historical view. Move a year slider and observe changes.

**Research question:** Can a visitor find and describe one interesting, verifiable difference in about two minutes?

**Not yet established:** whether the chosen sites have sufficient mapped historical coverage, whether views line up closely enough for meaningful comparisons, or whether visitors find the experience compelling. The five view presets are **not** five verified historical events.

### What version 0.1 does

- Two independent, interactive map embeds side by side (stacked on phones).
- Official [OpenHistoricalMap embed](https://github.com/OpenHistoricalMap/openhistoricalmap-embed), filtered by selected year, and the official [OpenStreetMap embed](https://wiki.openstreetmap.org/wiki/Export) for present-day comparison.
- Five Manchester viewpoint presets, four historical-period controls (4000 BCE–1 BCE, 1–999 CE, 1000–1599 CE, 1600–2026 CE), a year slider within each period, quick jumps (including Roman-era 79 CE), links to open each source, and shareable URL parameters. Previously shared links such as `?view=centre&year=1678` remain compatible.
- BCE date formatting follows OpenHistoricalMap's astronomical year convention: `year=-999` in this site's URL shows **1000 BCE** and is passed as `date=-0999` to the embed; `year=0` means **1 BCE**, not an invented year zero. These are **date selections**, not claims of feature coverage.
- No API keys, databases, accounts, analytics, generated claims, scraped map screenshots or build system.

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

1. Open the app in a desktop browser and on a phone, validate that both embeds load and the historical date really changes visible features.
2. Find **five specific OpenHistoricalMap features** with verifiable historical time bounds and original-feature links; check any `license=*` tags before describing/reusing them.
3. If the idea proves interesting, replace the iframes with directly controlled [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) maps and the [OHM date-filtering plugin](https://github.com/OpenHistoricalMap/maplibre-gl-dates) for truly synchronised viewports and immediate date updates.
4. Add a small evidence trail for each verified historical discovery: feature ID, date bounds, provenance, rights, and limitations.

## Rights and operating costs

- [OpenHistoricalMap rights](https://www.openhistoricalmap.org/copyright): generally CC0, **some features are CC BY or CC BY-SA**. Check the actual features and sources. The OHM-provided embedded map is not the same as redistributing independent third-party historical images.
- [OpenStreetMap attribution / ODbL](https://www.openstreetmap.org/copyright), [tile use policy](https://operations.osmfoundation.org/policies/tiles/): keep required credit visible; external map infrastructure has fair-use limits.
- [OHM embed repository](https://github.com/OpenHistoricalMap/openhistoricalmap-embed): the project provides date, location and layer URL controls and an embeddable map.
- The project's own original code has **no outbound software licence selected yet**. Do not add one without a conscious decision.

This is a small public-repository experiment, not a finished product or proof of a business opportunity.

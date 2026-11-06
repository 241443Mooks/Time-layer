# Time-Layer Explorer

A small, source-led time traveller's atlas: **choose a place, choose a year, compare then and now, and follow a trail of historical evidence and nearby discoveries.** Worldwide place lookup is powered by Wikidata; historical coverage still varies greatly by location and period.

[Source radar entry OL-033](https://github.com/241443Mooks/Open-license-radar/blob/main/data/experiments.csv)

## Status

**Live deployment (4 November 2026):** [time-layer.corneliuslobster.workers.dev](https://time-layer.corneliuslobster.workers.dev/). The new destination-first HTML and the Wikimedia-backed place search, place profile, place-specific OHM evidence and Castlefield's curated Mamucium research lead were all observed via the live service. Focused mocked interaction checks passed search → select Castlefield → choose 79 CE → follow Mamucium → retain the year and breadcrumb trail. **The v0.4 Past/Today control is visible on the deployed page and its state transitions passed a focused mocked interaction test. Real-device mobile usability and full browser interaction have not yet been independently verified.** This remains an exploratory build, not a historical authority. The date-filtered OHM map is a reconstruction, **not** a scanned map originally drawn in that year.

## Current experience — place first, time second

1. Search for a place **worldwide** using Wikidata, select an item with usable coordinates, or try Castlefield and Manchester.
2. Choose a year between approximately 4000 BCE and 2026 CE.
3. Flip between a date-filtered OpenHistoricalMap reconstruction and present-day OpenStreetMap **in one viewport**, centred on the selected location. The regular embed flip does not track independent dragging; the opt-in **Keep views aligned (BETA)** uses one MapLibre camera so switching past/today preserves your exact pan and zoom.
4. Read Wikidata/Wikipedia general context, then explore an optional **linked-place discovery trail**. Followed places keep the same year; breadcrumb buttons take you back.
5. Inspect the separate, collapsed **year-matched OHM evidence panel**; Castlefield also offers the official Historic England Scheduled Monuments pilot.

The five original Manchester viewpoint URLs, including `?view=centre&year=1678`, remain backward-compatible, but are no longer the main location picker. New place links look like `?place=Q2308772&year=79`.

**Research question:** Can a visitor travel somewhere new, investigate one sourced clue, follow a meaningful link, and return without losing their place and year?

### What the time-travel comparison does

- One shared map viewport with an accessible **Past · reconstruction / Today** switch. Both embeds stay loaded but only one is visible at once. They still **do not synchronise** pan or zoom.
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
- One deliberately **curated, source-backed** first link is now promoted to a visible discovery card and connects [Castlefield](https://en.wikipedia.org/wiki/Castlefield) to [Mamucium](https://en.wikipedia.org/wiki/Mamucium), the former Roman fort. The connection follows Castlefield's Wikipedia account; a linked article does not prove that the fort or any other feature was present in the precise year selected. The relation is explicitly distinguished from generic nearby Wikipedia articles.
- In-browser breadcrumb navigation preserves the visitor's year when they choose a new place. The place summary and nearby articles provide **general context, not year-specific evidence**.

**Interaction test (simulated DOM, not a live-device test):** Search Castlefield → select Q2308772 → change to 79 CE → follow Mamucium Q3285089 → keep 79 CE in the shareable URL; breadcrumb trail preserves Manchester → Castlefield → Mamucium. All checks passed.

Wikimedia has [2026 API usage limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits). Calls are identified, bounded, user-triggered or made on selected place changes, and responses are cacheable for a short period. A popular public release would require stronger server-side caching/quotas and an operational review. **Wikidata search is a place-entry mechanism, not comprehensive global geocoding.**

### Version 0.4 — Mobile map flip, real-map pointers and clearer trails

- Replaced the former **side-by-side/vertically stacked** embeds with a **single shared viewport**. Visitors flip between *Past · reconstruction* and *Today* using labelled, keyboard-operable buttons. The inactive pane is hidden from pointer and keyboard interaction, but preserved so toggling doesn't reload its iframe. There is no synced pan/zoom yet. The new switcher controls and archive link were externally observed on the live page on 4 November 2026, and a mocked button-state / no-reload test passed. Real-device testing is still outstanding.
- Added a collapsed **Want an actual old map?** disclosure with links to [NLS georeferenced map viewers](https://maps.nls.uk/geo/explore/) and the [David Rumsey Historical Map Collection](https://www.davidrumsey.com/view). This is **external exploration only**, not a licensed in-app historical raster overlay. NLS offers a free API layer for some 1920s–1940s OS maps of Great Britain; other layers have subscriptions/rights checks. Rumsey maps have item-level rights checks, particularly post-1929.
- Promoted the curated **Castlefield → Mamucium** sourced lead out of the generic nearby list, into an immediately visible `A thread to follow` card. The link is still explicitly attributed to Wikipedia and is not proof of an event in the exact selected year. Other geographically nearby links remain collapsible.
- A first **The National Archives Discovery API** research test returned 51 catalogue matches for `Castlefield Manchester`, including photograph catalogue entries from 1985/1986 and an 1854 engineering letter held by Bolton Archives. This is a **tested future connector, not currently rendered in Time-Layer**. Catalogue items describe records, not necessarily digitised images or documents; item URLs/rights need verification.

The evolving [discovery-warren design and tested source inventory](docs/discovery-warren.md) explains which relationships should be visible, the required source/date/licence fields, and the recommended small pilot for archaeological and archival trails.

### Version 0.5 — True shared camera (opt-in beta)

**Owner feedback:** the single-map flip felt good on a phone, but the two embedded maps drift apart when panned. The embedded historical map and the embedded modern map belong to different external websites: they cannot be reliably synchronized through Time-Layer's parent page.

Added an optional **Keep views aligned · BETA** switch just above the map. When enabled:

- A **single MapLibre GL JS 5.6.0 instance** loads OpenHistoricalMap's official [historical stylesheet](https://www.openhistoricalmap.org/map-styles/main/main.json) and the [MapLibre GL Dates 2.0.0 plugin](https://github.com/OpenHistoricalMap/maplibre-gl-dates). The chosen year filters the vector historical features.
- A present-day OpenStreetMap **raster layer** is drawn in the same MapLibre map; **Past / Today** switches this layer's visibility. Both views share the same centre, zoom, bearing and pitch because they are actually one map, not two independently hosted iframes. Panning, zooming, or rotating the map then flipping preserves the camera.
- Changing the selected **year** updates the date filter **without re-centring**. Choosing a **different place** re-centres the shared map. A shareable `?aligned=1` query parameter opts into the experiment.
- The existing iframe flip is **preserved as a fallback**. If the browser lacks WebGL, CDN dependencies fail, or the shared map does not finish loading within 18 seconds, the toggle switches off and the original maps reappear.
- **No historical scans are used.** The past layer remains an OHM reconstruction. The map is **not yet tested on a real mobile browser**. The MapLibre toggle, one-camera switching, date update and fallback were checked with a mocked map instance; presence of the new toggle and OHM style endpoint were confirmed live, but **actual third-party tile rendering has not yet been confirmed**.

**Operating caution:** The beta modern layer requests `https://tile.openstreetmap.org/` directly. This is appropriate only for limited respectful experiments under the [OSMF tile usage policy](https://operations.osmfoundation.org/policies/tiles/). Before scaling publicly, switch to an explicitly licensed tile provider or compliant hosting and verify caching, attribution, service policies and performance. The third-party script dependencies are currently pinned on jsDelivr; plan version upgrades and a CSP/reliability review before wider release.

**Android beta fix (5 November 2026):** A real-phone screenshot showed `window.maplibregl.supported is not a function` when enabling alignment. MapLibre 5.6.0 does not expose that function in this browser bundle. The compatibility check now only calls it if present; otherwise the Map constructor handles WebGL support. The beta also clears an interrupted initial-load promise so the toggle can be retried instead of immediately failing again. Both shared-camera flip/year and first-failure/retry passed focused mocked tests; the corrected script was retrieved from the live site. **Actual Android map tiles, alignment and performance still need field verification.**

**Suggested test:** Open [Castlefield in 79 CE with alignment on](https://time-layer.corneliuslobster.workers.dev/?place=Q2308772&year=79&aligned=1), move/zoom the map, press **Today**, then **Past**. The exact map position should remain unchanged. Change the year; your position should stay fixed. Switch **Keep views aligned** off to compare with the original embeds.

### Version 0.6 — Compact journey controls and image-led discovery (5 November 2026)

**From phone feedback:** The full place search and year controls dominated the viewport, and the discovery section contained too much uninterrupted text.

- **Collapsible journey strip**: place and year controls now sit in one `<details>` disclosure. A direct `?place=Q...&year=...` or legacy view link starts with the controls collapsed into a compact **place · year** heading; a brand-new unconfigured session opens the controls. Selecting a new place collapses them, while adjusting a year leaves them open until the user finishes. **Explore this place** closes the controls and jumps to the map. The summary always reflects the current selection.
- **Optional fold-away map**: the map viewport and its controls now live inside an open-by-default disclosure. Close it to focus on discoveries, and expand it again at any time. The shared MapLibre renderer receives a resize event when revealed, without changing its camera.
- **Shorter introductions**: Wikipedia background is shown as a short preview (up to about 245 characters) with the full extract behind **Read more about this place**.
- **Wikimedia Commons image pipeline**: the place details endpoint obtains free-licensed Wikipedia PageImages (the place and its curated lead plus nearby articles), validates the underlying files using a bounded Commons `imageinfo` request and requires an allowed individual image licence such as CC BY, CC BY-SA, CC0 or public domain. Only validated Commons images are returned; creator, licence and original file page accompany each image. No unverified thumbnail is displayed. Media lookup failure does not break the place record.
- **Image-led pathways**: a credited hero illustration, a credited image for the first sourced historical thread (where available), and up to three horizontally scrollable pictured nearby subjects. The other nearby links remain expandable. Images are explicitly labelled as **illustrations with unspecified creation date**, not photographs or maps of the selected historical year.
- **Live source check:** `/api/place?id=Q2308772` returned a verified-licence Castlefield image (CC BY-SA 2.0), a Mamucium illustration (CC BY 2.0) and licensed images on six nearby article records. Mocked DOM interaction tests passed for media/credits, short versus full text and compact journey controls. The updated HTML was observed live, but real Android tactile and performance testing is still required.

**Discovery distinction:** Searching “London Bridge” currently returns both London Bridge station and multiple historic bridge entities. For 1625 CE, the separately identified [London Bridge (1209–1831), Wikidata Q56739974](https://www.wikidata.org/wiki/Q56739974) is a more suitable research lead than the railway station. Name matches must not be automatically treated as interchangeable sites or historical entities.

See [Discovery Warren roadmap](docs/discovery-warren.md). Authentic georeferenced scans, museum artefact media, audio, video and a multi-source knowledge graph are **future work**, not yet included in this version.

### Version 0.7 — Date-matched imagery and verified archive map items (6 November 2026)

From real Android feedback: a **2018 photo of London Bridge station** dominated a page showing **1735**, and the old-map link led only to an archive directory. Both were misleading or unhelpful.

**Changes shipped:**

- A picture only displays in the Discovery Warren if it has a Commons-verified reuse licence **and an interpretable creation date within 20 years of the selected year**. Date-less files, vague centuries, and broad ambiguous creation ranges do not qualify. The media caption displays the *real creation date and year difference*; this is **not** a claim about when a scene was depicted.
- Source-specific Commons candidates are found through bounded, place-named historical artwork searches (`GET /api/period-images?id=Q...&year=...`). Candidate files are vetted for title/place match, individual licence, creation date, safe image URLs and closeness to the year, then ranked. This is a lead list, not proof of exact historical depiction. Requests are debounced client-side and cached, and failure does not block the main place profile.
- Existing hero, featured and nearby images are re-filtered when the year changes. **No eligible image means no image**, not a modern decorative picture.
- The old **generic historical-map archive directory link is gone**. Source records are presented only when the exact place entity, geographical coverage and item year have been verified. The first manually verified example is [Rocque's 1746 London sheet 2E](https://www.londonpicturearchive.org.uk/view-item?i=30771), record 33549 at the London Archives: its record expressly lists **London Bridge**. The original-map link appears only for [the separate 1209–1831 bridge entity](https://www.wikidata.org/wiki/Q56739974) within 15 years of 1746, with the actual map date/difference shown. **The source image is not copied into Time-Layer.**
- London Bridge railway station is a separate Wikidata entity (Q801125). If exploring that station in the bridge's historically relevant years, a dated source-identity lead points to the earlier bridge without conflating the two subjects.

**Live source examples:**

- `/api/period-images?id=Q801125&year=1735` returned **zero** period images. The station's default Wikimedia photo has a documented 2018 creation date; it must not appear on a 1735 page.
- `/api/period-images?id=Q56739974&year=1735` returned a Commons public-domain Samuel Scott artwork created **1753**, 18 years after the selected date, explicitly labelled a nearby-period *research lead*, not a view proven to depict 1735.
- The 1746 London Bridge sheet is **11 years later** than a 1735 selection. A direct source link is allowed with that explicit difference; 1500 or a different named entity shows no map link.

The 20-year image and 15-year map cutoffs are transparent, conservative **pilot tolerances**, not historical standards or claims of accuracy. They can be tightened following review. See [source-matching and ranking rules](docs/source-matching.md) for the source registry, gates and next adapters (NLS sheet metadata, Library of Congress, Europeana, archaeology and museum objects). The Commons and map-link logic passed focused date, selection and navigation tests; Android visual verification is still needed.

### Version 0.8 — Stay in a place, move through its history (6 November 2026)

From user Android testing of Tower of London at 1815 CE: an expanded evidence panel became a long list of low-value details, including a building named `yes` and repeated changes. The map also came before the more compelling Warren, creating unnecessary scroll.

- **In-place time travel**: a compact, horizontal **Travel through this place** strip shows ±25 and ±100-year hops while preserving the selected place, map centre and shared URL. A user-initiated **Find dated changes nearby** action reuses the same bounded OHM evidence query and cache to surface up to four deduplicated, *named* recorded starts/ends as local year-jump buttons. It does not require opening the long evidence panel; searches are not exhaustive.
- **Discovery leads**: the Warren is now **before** the optional map viewport; **Explore this place** scrolls to discoveries. A small **View the map** link remains. Wikimedia context is condensed to a short preview while full text stays behind Read more.
- **Evidence without walls of text**: statistics, query limitations, dated features and recorded changes are separate collapsed disclosures. Named feature cards expand inside Time-Layer before offering outbound OHM or original-source links. Generic `building=yes` labels are no longer mistaken for feature names, and identical named date events are deduplicated.
- **Vague dates as ranges**: Commons `DateTimeOriginal` now accepts unqualified centuries (e.g. **17th century = 1601–1700 CE**, **18th century = 1701–1800 CE**) and explicit bounded year spans of up to 100 years. The image is relevant only *within* that broad interval, receives a lower ranking than year-specific records, and is labelled with its uncertainty instead of a fabricated year. Broad intervals are **not** coerced to the end of the century. Dates such as `before 1800` with no lower bound, or `early/mid/late 17th century` qualifiers without a supported mapping convention, remain unresolved; no unsupported midpoint is inserted.
- **Important scope:** this broad-date improvement currently applies to Commons historical imagery. The main OpenHistoricalMap historical reconstruction and year-compatible list **still require sufficiently precise start/end tags**, and an OHM 25-year query can omit features with only broad-century tags. We must not claim to have solved that source limitation.
- **Checks**: focused tests passed for century/range boundary eligibility, a Tower-of-London-style nearby event sample and in-place year hopping, and reuse of the OHM cache without a duplicate lookup. Live page selectors confirmed the time strip and Warren presence; actual tactile device testing and visual QA remain with the user.

The [source-matching rules](docs/source-matching.md) and [Discovery Warren direction](docs/discovery-warren.md) track the wider opportunity: a typed place chronology with dated events, people, archaeological objects and original archive maps instead of an endless scroll of unrelated evidence.

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

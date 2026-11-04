# Evidence layers: build depth, not a source directory

**Research note — 4 November 2026.** **Place → Year → Maps → Discover → Evidence** is now the primary interaction. The interface supports worldwide Wikidata place search; historical data is still highly uneven.

## Layer 1 — OpenHistoricalMap (implemented)

- Scope: global community-built historical geographical features with optional start/end dates, [EDTF uncertainty](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Tags/Key/start_date), and source tags.
- Now queries a **bounded local box around either a legacy Manchester preset or a Wikidata-verified worldwide location** for a 25-year window via OHM Overpass, filtering before the 150-record cap. The browser then filters to the specific selected year. Up to twelve viewpoint-and-window responses are cached client-side. This improves representation of earlier history but does not guarantee completeness or remove the cap.
- **Main list:** requires an interpretable `start_date` no later than the selected year and, where a parseable `end_date` exists, requires that the selected year is no later than that end. Future/expired records are hidden. End-only, unparseable/EDTF-only and undated records are **unresolved**, not assumed to have been present. A missing end date does not prove persistence, so all matches are described as *date-compatible*, never as historical facts.
- **Earlier recorded changes:** only start/end dates up to the chosen year; later dates are hidden. This is for exploration, **not a comprehensive historical timeline**.
- **Data completeness:** a missing match may reflect the query cap, incomplete historic mapping, an uncertain/unparseable date, or missing data—not an empty landscape.
- **Quality follow-up:** understand [OHM EDTF date conventions](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Dates_and_Times), bias of the first 150 records, and whether a *date-aware server query* would reduce false zero-match impressions while keeping the slider responsive.
- Source: [OHM Overpass](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Overpass).

## Layer 2 — Historic England (Castlefield Scheduled Monuments pilot LIVE)

The [National Heritage List for England](https://historicengland.org.uk/listing/the-list/data-downloads/) (NHLE) provides a high-value, **England-only** additional source. It can identify heritage sites, add statutory designations and source links, and offer **places to research** when OpenHistoricalMap has sparse coverage.

**Official API:** https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer

Two source layers worth piloting:

- **Scheduled Monuments, layer 6** — boundaries of nationally important protected archaeological sites, including Roman remains, castles, burial mounds, and industrial sites. Attributes include `ListEntry`, `Name`, `SchedDate` and `hyperlink`.
- **Listed Building points, layer 0** — records with `ListEntry`, `Name`, `Grade`, `ListDate` and `hyperlink`. A point may represent a surviving later structure rather than one extant at a chosen historical date.

Official [API catalogue](https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/) and [ArcGIS layer details](https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/6?f=pjson).

### Critical chronological distinction

A **listing date (`ListDate`)** or **scheduling date (`SchedDate`)** records when the *designation happened*, **NOT** when the building/monument existed or was constructed. It must **never** be used as the historical appearance/start date on a 1000 BCE map.

Until there is a trustworthy period-of-origin or site chronology, Historic England records should appear in a separately labelled **“Protected heritage nearby — age not yet established”** disclosure. These are potential leads for historical investigation, **not a list of structures present in the selected year**. For ancient years, explain the difference especially clearly.

### First 1–2-day test and verification

1. **Done:** query just Scheduled Monuments layer 6 around Castlefield. Official API returned [Remains of eastern wall of the Roman fort — 1001953](https://historicengland.org.uk/listing/the-list/list-entry/1001953). Public /api/heritage?view=castlefield route confirmed live; source provided no `SchedDate`.
2. **Partially done:** the spatial query uses WGS84 (`inSR=4326`) against the API's native EPSG:27700 data and requests attributes only; response verified. It has a fixed Castlefield envelope, 12-record limit, 12-second timeout and public 24-hour cache. Geographic precision and production reliability still need more testing.
3. **Done:** source commits add a second nested `Protected heritage nearby` disclosure inside the main evidence panel, collapsed by default and visible only for Castlefield. It fetches on demand; the whole evidence panel is itself collapsed by default on mobile.
4. **Next:** extract independently supported site chronology from the official entry for the Roman fort wall, with a traceable citation. Do not infer age from scheduling/designation dates.
5. Test on 79 CE and 1000 BCE. A user must be able to distinguish (a) *features recorded for this year*, (b) *nearby heritage worth researching*, and (c) *absence of evidence in the selected data*.

**Licensing:** NHLE geospatial data is provided under the [Open Government Licence](https://historicengland.org.uk/listing/the-list/data-downloads/). Follow the published Historic England and Ordnance Survey / Crown copyright attribution requirements. This does **not** grant blanket reuse rights for every photo, document, third-party map or linked record.

## Layer 3 — Wikidata + Wikipedia (first discovery experience LIVE)

- **Worldwide place search**: bounded Wikidata `wbsearchentities` followed by entity coordinates (P625) and English labels; displays up to seven coordinate-bearing results after the user submits a name. No auto-suggest or address-level guarantees. Selected Wikidata coordinates are modern map reference points.
- **Place profile**: Wikidata source identity plus English Wikipedia summary and a source link. Summaries are **not time-filtered evidence**. API rate limits, User-Agent and caching rules apply.
- **Follow a connection**: up to nine nearby Wikipedia articles with coordinate-bearing Wikidata identifiers, plus an explicitly sourced first relationship **Castlefield Q2308772 → Mamucium Q3285089** from Castlefield's Wikipedia introduction. Nearby does not imply historical coexistence; a linked page does not independently establish an archaeological interpretation.
- **Breadcrumbs**: navigate to another mapped place without changing the selected year, then revisit an earlier place. Shared URLs use `?place=Q...&year=...`; the older `?view=castlefield&year=79` route is maintained.
- **Proof of interaction**: simulated DOM test passed search/select/year/relationship/breadcrumb flow; actual phone testing remains outstanding.
- **Evidence separation**: OHM date-matched records and Historic England's legal designation records remain in distinct disclosures, after the maps and the Wikimedia general-context panel.
- **Rights**: Wikidata CC0 metadata, Wikipedia CC BY-SA article text and explicit link/attribution. Do not blindly reuse linked images or archive objects.

Next: corroborate Mamucium's historical chronology against official archaeological records, add place identifiers across sources only when reconciled, and consider direct map selection once both mapping panes use controllable map components.

## Later: depth candidates, not commitments

Prefer one verified source that materially addresses a specific gap over adding generic APIs. Potential work includes historic map scans/tiles (their own georeferencing and image licences), authoritative excavation reports, and community-verified feature-to-monument links. This is a **source-evidence pipeline**, not a “show everything” feed.

## Mobile UX principle

Current panel is collapsed by default. Keep the map and year selector central; use short in-panel summaries plus optional details. Defer larger layout redesign until the new layers are useful and have been tested on real mobile devices.

**Status (4 November 2026):** Place-specific OHM period-window queries verified in production (Castlefield Q2308772 at 79 CE), and the Historic England Scheduled Monuments API remains Castlefield-only (Roman fort wall NHLE 1001953). Worldwide Wikidata place search and Wikimedia background/nearby-links APIs are live; a source-backed Castlefield → Mamucium lead is available. **Worldwide historical completeness is not claimed.** Frontend live mobile interaction still needs user testing.

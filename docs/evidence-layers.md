# Evidence layers: build depth, not a source directory

**Research note — 4 November 2026.** Keep **travel through time** as the primary interaction: select a place and year, compare historical and present-day maps, and optionally inspect evidence beneath the maps.

## Layer 1 — OpenHistoricalMap (implemented)

- Scope: global community-built historical geographical features with optional start/end dates, [EDTF uncertainty](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Tags/Key/start_date), and source tags.
- Current prototype queries a **bounded fixed box**, returns up to 150 records, and filters the *display* locally to the chosen year.
- **Main list:** only records whose available `start_date`/`end_date` bounds are compatible with the year. Earlier/later records are never silently displayed as contemporary. Records with neither an interpretable start nor end are **unresolved**, not “present”.
- **Earlier recorded changes:** only start/end dates up to the chosen year; later dates are hidden. This is for exploration, **not a comprehensive historical timeline**.
- **Data completeness:** a missing match may reflect the query cap, incomplete historic mapping, an uncertain/unparseable date, or missing data—not an empty landscape.
- **Quality follow-up:** understand [OHM EDTF date conventions](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Dates_and_Times), bias of the first 150 records, and whether a *date-aware server query* would reduce false zero-match impressions while keeping the slider responsive.
- Source: [OHM Overpass](https://wiki.openstreetmap.org/wiki/OpenHistoricalMap/Overpass).

## Layer 2 — Historic England (next focused experiment; NOT integrated yet)

The [National Heritage List for England](https://historicengland.org.uk/listing/the-list/data-downloads/) (NHLE) provides a high-value, **England-only** additional source. It can identify heritage sites, add statutory designations and source links, and offer **places to research** when OpenHistoricalMap has sparse coverage.

**Official API:** https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer

Two source layers worth piloting:

- **Scheduled Monuments, layer 6** — boundaries of nationally important protected archaeological sites, including Roman remains, castles, burial mounds, and industrial sites. Attributes include `ListEntry`, `Name`, `SchedDate` and `hyperlink`.
- **Listed Building points, layer 0** — records with `ListEntry`, `Name`, `Grade`, `ListDate` and `hyperlink`. A point may represent a surviving later structure rather than one extant at a chosen historical date.

Official [API catalogue](https://www.api.gov.uk/he/national-heritage-list-for-england-nhle/) and [ArcGIS layer details](https://services-eu1.arcgis.com/ZOdPfBS3aqqDYPUQ/arcgis/rest/services/National_Heritage_List_for_England_NHLE_v02_VIEW/FeatureServer/6?f=pjson).

### Critical chronological distinction

A **listing date (`ListDate`)** or **scheduling date (`SchedDate`)** records when the *designation happened*, **NOT** when the building/monument existed or was constructed. It must **never** be used as the historical appearance/start date on a 1000 BCE map.

Until there is a trustworthy period-of-origin or site chronology, Historic England records should appear in a separately labelled **“Protected heritage nearby — age not yet established”** disclosure. These are potential leads for historical investigation, **not a list of structures present in the selected year**. For ancient years, explain the difference especially clearly.

### Next 1–2-day test

1. Query just the **Scheduled Monuments** layer around Castlefield using a small bounding geometry and return a handful of records with official entry links.
2. Check response geometry, coordinate reference system (**source EPSG:27700**, client map WGS84), rate limits, field values and how much location ambiguity exists. Use bounded server-side calls with a time-out and caching.
3. Show results in a **secondary nested disclosure**, intentionally separate from date-compatible OHM records. Do **not** display all protected sites by default on mobile.
4. For one Roman site, follow the official entry to extract independently supported historical period text and a traceable citation. **Do not infer age from designation timestamps.**
5. Test on 79 CE and 1000 BCE. A user must be able to distinguish (a) *features recorded for this year*, (b) *nearby heritage worth researching*, and (c) *absence of evidence in the selected data*.

**Licensing:** NHLE geospatial data is provided under the [Open Government Licence](https://historicengland.org.uk/listing/the-list/data-downloads/). Follow the published Historic England and Ordnance Survey / Crown copyright attribution requirements. This does **not** grant blanket reuse rights for every photo, document, third-party map or linked record.

## Later: depth candidates, not commitments

Prefer one verified source that materially addresses a specific gap over adding generic APIs. Potential work includes historic map scans/tiles (their own georeferencing and image licences), authoritative excavation reports, and community-verified feature-to-monument links. This is a **source-evidence pipeline**, not a “show everything” feed.

## Mobile UX principle

Current panel is collapsed by default. Keep the map and year selector central; use short in-panel summaries plus optional details. Defer larger layout redesign until the new layers are useful and have been tested on real mobile devices.

**Status:** OHM year filter committed; Historic England adapter not written or deployed. Keep that distinction in the app and radar.

# A rabbit hole, not a map catalogue — v0.4 direction

Date: 4 November 2026. The priority is **source-backed discovery that rewards following a thread**, with the map as a compact orientation aid rather than the whole experience.

## Shipped in code

- Single **Past · reconstruction / Today** map viewport (one frame visible; both embed instances stay mounted so switching does not reload). New UI markup and event logic were verified, but this does **not** synchronise the two independently pannable maps after a drag.
- Small optional archive disclosure links to **National Library of Scotland** and **David Rumsey**, without copying maps or falsely claiming an image from the user's selected year.
- The first curated historical connection **Castlefield → Mamucium** is now immediately visible as a prominent source-backed invitation, not buried in generic geographically nearby links. Its cited source is Castlefield's Wikipedia overview; it is NOT independent archaeological validation of Mamucium's occupation in precisely 79 CE.
- The existing world place search, year slider, OHM year-matched evidence, optional Historic England Castlefield research lead, and shareable breadcrumb journey remain.

## Genuine maps are feasible

**NLS maps:** https://data.nls.uk/tools/maps-and-tools/ — 220,000+ historic map scans online. Many are georeferenced and can be overlaid, side-by-side, compared using a swipe view, etc. The publicly described free Historic Maps API has a **1920s–1940s GB OS layer**; more detailed and older georeferenced layers have subscriptions/licence considerations. The interactive NLS viewer has many map periods, but viewer access is not permission for unrestricted reuse of its imagery or tile services.

**David Rumsey:** https://www.davidrumsey.com/view — a large international collection with georeferenced maps and viewer tools. Rights are **item-specific**, notably some post-1929 works; permission and credit are required where applicable. There is no verified universal public free tile feed for Time-Layer.

**Product constraint:** One selected year might have zero surviving scanned maps. Show a separately labelled **map publication year**, scale/coverage, provenance and licence. If the nearest map was made in 1848, never pretend it depicts 1678 exactly. Underlay georeferenced scans only if licensed. Otherwise provide a link to the original viewer.

## Warrens: meaningful connection types

| Thread | Example | What to retain |
|---|---|---|
| Place → landmark | Castlefield → Mamucium | Relationship type and a citation for the link |
| Landmark → artefact | Roman fort → excavated object | Museum accession number, place relationship, dating uncertainty |
| Site → original map | Castlefield → mapped 1848 | **Map's publication year**, georeferencing, sheet boundaries and image rights |
| Site → event | Roman fort → founding/occupation phase | Source-supported historical interval, not a modern listing date |
| Place → archive document | Castlefield → 1854 engineering letter | **Document creation date**, holding archive, reference and rights |
| Place → person / alias | Mamucium → alternate historic name or related person | Wikidata identifier, documented relation, period caveat |
| Place → later view | Castlefield → 1986 photograph record | Photograph date separate from historical year |

Every thread should record:
- `from` and `to` as typed source IDs (e.g. Wikidata QID, NHLE ListEntry, TNA reference) so identical names are not conflated
- `relationType` and **evidenceURL**
- `dateSubject` (when the described thing existed), `dateSource` (when the item/map was created), and `dateDesignation` where applicable
- `datePrecision`, `confidence` / caveat, `license`, `attribution` and `lastChecked`
- `discoveryMode`: sourced explicit link vs tentative nearby suggestion vs same-term catalogue match
- The user should be able to return to their original place and year at any point.

Default UI: one map viewport; a small place/year strip; a **featured, traceable thread**; expandable groups for **Places, Events, Artefacts, Archival material, Historic maps**, but only if verified results are available. Avoid displaying giant counts and full source dumps unless expanded.

## Next connector worth testing: The National Archives Discovery

Verified API query on 4 November 2026:
`https://discovery.nationalarchives.gov.uk/API/search/records?SearchQuery=Castlefield%20Manchester&ResultsPageSize=5&Page=0`

Returned **51 total catalogue matches** for Castlefield Manchester, including:
- A Greater Manchester County Record Office / Manchester Archives photograph entry dated **1986**, catalogue reference **D53/224**
- Another photograph record, **1985**, **D53/152**
- An **1854** engineering correspondence entry from Bolton Archives, titled **VAUGHAN & HOSSACK, CASTLEFIELD IRONWORKS, MANCHESTER**, catalogue reference **ZHH/4/464**

These are **catalogue descriptions, not the digitised photographs or letters themselves**; direct item links and reuse terms need verification. We could display dates, title, reference and holding archive in a collapsed *Across the centuries* section. These items **must not** be treated as things extant in 79 CE. Relevant docs: https://www.api.gov.uk/tna/discovery/ and https://discovery.nationalarchives.gov.uk/API/Help/Api/GET-search-records .

The API supports search by terms and returns bounded pages. More source types should be integrated only when their API availability, rights, item URLs and value to navigation are confirmed.

## Next 1–2 day vertical slice

1. **Mobile usability:** verify the flip in a phone browser; check frame height and focus restoration. Syncing map pan/zoom remains a later MapLibre/renderer project.
2. **One archive/source trail:** use Castlefield → Mamucium → a *verified* official archaeology or museum record, and optionally a dated archive document from Discovery. Its connection should tell the user *why it's relevant*, not simply be nearby.
3. **Genuine historic map pilot:** for Manchester around 1900 or a decade that matches the free NLS layer, test one georeferenced scan/tile source, the actual sheet date and its licensing. Start with a source link; promote to an in-viewport third mode only if legally and technically supported.
4. **Iterative UX:** replace the expanding sea of lists with compact source cards and a persistent year-and-place breadcrumb. Keep clear "on this date" versus "evidence made later" sections.

**Not shipped:** original map overlays, deeper archaeology or museum content, National Archives records in the Time-Layer frontend, synced map dragging, and an automatically constructed multi-hop knowledge graph.

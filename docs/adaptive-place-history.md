# Adaptive place history: the next Time-Layer product model

*Research/design decision, 6 November 2026. Not yet implemented as a full feature.*

## Core experience

**Choose a place → Establish what the place is → Find the earliest supported evidence → Show a chronological history → Follow source-backed connections.**

The historical record and the map are *features* of the experience; neither should force the visitor to scroll through source metadata. Each historical moment is a small visual card with a date or period, what happened, why we think so, and a doorway into deeper records. The map is collapsed or compact by default and shown when geographical comparison genuinely helps.

Time-Layer v0.8 already has a compact in-place ±25/100-year traveller and a bounded OHM *Find dated changes nearby* action. Those are navigation/sample features, **not** a full place chronology. This proposal builds on them instead of duplicating them.

### Proposed place header

- Place name, location, and **type**: home/address, landmark/building, archaeological site, religious complex/institution, settlement/region, uncertain.
- *Earliest documented evidence for this place*: source-date and precision, clearly sourced (e.g. *first visible on a surveyed map by 1892*).
- *Earliest evidence from this site*: separately labelled prior land uses, archaeological traces, predecessor buildings. May precede the current named place by centuries.
- *Current source coverage*: the time span and geography **actually checked**. No claim of completeness.
- Four or fewer relevant entry points: **Earliest known**, **Major changes**, **Around [chosen year]**, **People & objects**. Expandable by category and source rather than one enormous scrolling timeline.

**Never equate earliest record with origin.** If no reliably dated evidence exists, show *Earliest date not established*; allow browsing the site's wider local history instead. If the first record is from a 1900 map, the building may have existed earlier.

### Dates and jumps

Keep the source date as a typed interval with precision, relation and uncertainty. A 17th-century event is 1601–1700; a **1700** jump is a convenient navigation choice, not a historical date. Separate event date, source creation date, survey/map date, date depicted, modern legal designation and digital upload date. BCE calendar and date range handling must not silently introduce a year-zero error.

A record must indicate what the date applies to: *building existed by 1892*, *document written in 1753*, *monument first legally scheduled in 1925*, or *event during the 17th century*. A clicked moment updates the current year in place, but **does not change the evidence's stated precision**.

## Place identification and adaptive research planner

The user asks about one place, but the app should select sources by **place type, region, precision required, and available identifiers**, rather than querying everything.

| Query type | Primary question | Preferred source adapters | What to avoid |
| --- | --- | --- | --- |
| **House or exact address** | How old is this specific building? What stood on its plot? | Verified geocoder/UPRN when licensed; dated local OS maps and sheet metadata; local Historic Environment Record; planning/building-control archives; Historic England if listed; optional EPC age bands; Land Registry sales/history with appropriate terms | Wikidata alone (most homes absent), mistaking a map survey date for construction, exposing data about living residents |
| **Known protected landmark** | What are the important phases of this named monument? | Named institution's official site and specialist collections; NHLE/HER archaeology; dated archival sources; Wikidata identifiers and Wikipedia for leads; historical map records | Nearby generic buildings or unrelated present-day photographs overshadowing a monument's chronology |
| **Major religious/institutional complex** | What were its building phases, institutions, artworks, manuscripts and events? | Official institutional catalogues, archival image records/IIIF when permitted, monument records, place-specific scholarship, Wikidata relationships; language-aware search | Conflating artworks *in a place* with objects *made there* or with the date the structure was built |
| **Settlement, neighbourhood or countryside** | How did the landscape and activity change here? | OpenHistoricalMap, national and local HERs, maps, archival photos, gazetteers, environmental/land-use and archaeological records | Assigning every nearby event to the exact point or selected year |

**Classification is uncertain.** Allow a person to select the intended entity/type, especially with ambiguous names. A place can have multiple identities (e.g. Roman site → later fortress; historic bridge vs present-day railway station), and the planner should let visitors change research scope. A single location does not imply a single continuous building or institution.

### Confirmed research possibilities and caveats

- **UK house/history:** Historic England documents how OS maps, tithe surveys (1836–1850), the 1910 valuation, old building plans, local archives and photographs can establish successive evidence. Official sources: https://historicengland.org.uk/advice/your-home/your-homes-history/how-to-find-out/history-of-house/ ; https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/houses/ .
- **Accurate UK address resolution:** Ordnance Survey Places API supports postcode, address and UPRN queries; commercial access/licences must be assessed before adding it. https://www.ordnancesurvey.co.uk/products/os-places-api .
- **UK property dates:** EPC data are available via an API, but certificates start in 2008 and construction age bands are not exact build dates. https://get-energy-performance-data.communities.gov.uk/ . HM Land Registry price-paid transactions start from 1995; a sale is not a building's inception. https://www.gov.uk/guidance/about-the-price-paid-data .
- **Local archaeology:** English HERs are useful for non-designated monuments, finds, sites and the surrounding landscape; basic records may be online, but full bulk reuse/coverage varies. https://historicengland.org.uk/advice/technical-advice/information-management/hers/ .
- **Tower of London:** Historic Royal Palaces documents the Norman fortress beginning in the 1070s, and archaeology on the same site records Roman structures. It illustrates the need to distinguish *this site* from *this fortress*. https://www.hrp.org.uk/tower-of-london/history-and-stories/the-story-of-the-tower-of-london/ ; https://artsandculture.google.com/story/a-chronology-of-the-tower-of-london-historic-royal-palaces/jAVBaYRYnzkI4A?hl=en .
- **Vatican:** the Vatican Apostolic Library provides digitised objects through IIIF; the Vatican Museums also has its own collection catalogue. These are object collections, not a turnkey chronology for Vatican City. Check per-item rights, manuscript production and subject vs place relationships. https://www.vaticanlibrary.va/en/ ; https://www.museivaticani.va/content/museivaticani/en/collezioni/catalogo-online.html .
- **Wikidata:** inception (P571), time qualifiers (P580/P582) and earliest/latest bounds (P1319/P1326) provide typed clues with variable precision. Preserve qualifiers and references; do not treat an unsourced property as authoritative. https://www.wikidata.org/wiki/Help:Dates/en-gb .

## Provider and evidence ranking

1. **Hard gate:** correct entity/plot or explicitly disclosed broader context, usable source, dated historical assertion, rights/reuse suitability.
2. **Prefer exact identity and typed relationships** over string match; exact property over street, street over neighbourhood, neighbourhood over city, city over world.
3. **Prefer specialised primary records** (official collection, archaeological report, original map/document) for the assertion in question; allow Wikimedia as discovery context.
4. Score **date relevance and precision** (exact year, year range, century), never overwrite the original date with a jump year.
5. Reward a *new connection that explains the original place*, not a repetition of the same generic Wikipedia summary. Group duplicate accounts of one event and preserve multiple citations.
6. Tag content **Verified / Research lead / Wider context** in data, and display only the necessary qualification at the point of use.

### Minimum typed data model

```text
Place { id, names, placeType[], location?, historicalFootprint?, jurisdiction, identifiers[], classificationConfidence }
EvidenceRecord { id, sourceId, sourceUrl, licence?, retrieved, geographicScope, rights?, textOrMedia }
HistoricalClaim { id, subjectPlaceId, relationType, eventType, timeStart?, timeEnd?, timePrecision, timeBasis, jumpYear?, supportingEvidenceIds[], confidenceLabel }
Connection { fromEntityId, toEntityId, relationType, evidenceIds[], timeStart?, timeEnd? }
ResearchSession { selectedPlaceId, selectedYear, scope, visitedPlaceIds[], openedClaimIds[] }
```

The **earliest known** card is a query over eligible *claims with scope*. The earliest time in a capped OHM sample is never displayed as the true earliest occurrence of the place; at most call it *earliest dated record returned in this sample*.

## A deliberate next 1–2-day vertical slice

1. Start with two contrasting known places: **Tower of London** (official institutional chronology) and an **anonymous sample UK residential street/block** (not a private person's address or occupant details). Use an institution and a home so the routing difference is visible.
2. Add an **earliest known evidence** summary and 3–5 *typed* historical moment cards with source links and jump-year buttons. No decorative filler, and keep text/card height small on mobile.
3. Use the existing MapLibre map as a collapsible optional detail and keep the year selection, shareable URL and breadcrumbs as existing functions.
4. Integrate one additional source adapter only if it yields traceable, dated and related material for one of those journeys. Record licence, retrieval cost and coverage.
5. Test the result as a *warren*: select a place, follow a historical moment to a related place/object/map, jump time, return. Measure the proportion of useful, source-linked steps, not number of API calls.

## Explicit non-goals

Do not promise a comprehensive house genealogy or exact year built from an address, publish current residents' personal details, infer private residence ownership history, merge ambiguous places, claim global coverage, invent a founding year, or rank an uncited colourful story above specialist verified evidence.

## v0.9 implementation, 6 November 2026

**First working vertical slice implemented and checked against the live deployment:**

- `GET /api/place-history?place=Q62378` returns a deliberately bounded source-backed chronology for Tower of London. Seven documented chapters include Roman site context (around AD 200), White Tower construction (1078–1100), 13th-century expansion, the Tower Mint, 1381, the Mint's move and the Grand Storehouse fire. Each card has an original source and a typed historical date with a year-jump value. The earliest on-site evidence and earliest construction evidence are separately described. *They are the earliest evidence included in this curated pilot, not global completeness claims.*
- `GET /api/place-history?demo=home` returns a distinct **anonymous house research route** based on Historic England and The National Archives. It explains building plans, first map appearances, tithe maps and valuation survey records. Its earliest construction date is deliberately **not established**, with no fabricated home, address, owner, or occupancy data. The date of a class of records is **not** a date of any house.
- Other named entities receive a **no verified chronology yet** status instead of automatically inventing a history from nearby OpenHistoricalMap elements or general Wikipedia content.
- The source-backed UI sits after the compact time traveller, ahead of the wider Warren. It contains two short source-credited earliest-evidence facts and a horizontally swipeable sequence of moment cards. Tapping a chapter's year dispatches the existing in-place year control; full date basis and original reference live behind a small per-card disclosure.
- Live routes and HTML controls were checked; a focused simulated-DOM interaction tested Tower → jump to 1300 → house research route → return → unresearched location, including seven dated chapters, four source research methods, two distinct earliest concepts, and empty-state behaviour.

**Not done:** general automated place typing; accurate house address/UPRN resolution; dynamic multi-archive search; provenance-aware record reconciliation; worldwide timelines; personal property records. These belong to a later staged engineering project, not to v0.9.

**Next engineering step:** build a source-adapter and claim schema that can populate a chronology from at least two *independent* providers with conflicting dates, deduplication, explicit selection policies and durable tests. The `docs/adaptive-history-codex-brief.md` document specifies that larger Codex-sized phase.



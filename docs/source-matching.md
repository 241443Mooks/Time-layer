# Source matching: place, year, and evidence before decoration

Updated 6 November 2026. The goal is a trustworthy historical discovery **warren**, not a collection of vaguely relevant thumbnails or an indiscriminate list of map viewers.

## Eligibility gates

A candidate is **not displayed** merely because a keyword, article or coordinate matches. It needs all relevant checks:

1. **Place identity:** a verified Wikidata QID or confirmed geographic coverage, or a clearly labelled tentative subject/title match. Never conflate London Bridge station (Q801125), the 1209–1831 bridge (Q56739974), or the modern bridge (Q130206).
2. **Temporal basis:** distinguish **creation / publication date**, **date depicted**, **site's existence/occupation period**, **legal designation date**, and **digitisation/upload date**. Never infer one from another. If an image has no defensible creation date, do not use it as a selected-year illustration.
3. **Time distance:** current *pilot* accepts Commons images created within **20 years** of the chosen year, or tightly bounded creation ranges (≤20-year span). Direct historic maps are limited to a verified place and within **15 years** of their published/item year. **The exact difference is always stated**; proximity is not proof of an identical landscape.
4. **Rights:** images must have verifiable file-level Commons licensing and credits. Archive sheet links must go to a verified catalogue/item record. We link externally when we do not have permission to serve imagery.
5. **Source quality:** must preserve the original file page/item permalink and archive/creator. Unsupported assertions or provenance-free results should never become positive historical claims.

If no candidate passes, **show no image or map link**, rather than falling back to a modern photo or an archive homepage.

## Current source adapters and their role

| Source | Type | What is implemented | Limits |
| --- | --- | --- | --- |
| OpenHistoricalMap | Mapped features | Year-dependent reconstruction and evidence search | Coverage varies; dates may reflect statuses, not creation |
| Wikimedia Commons | Images and artworks | File licence, creator, `DateTimeOriginal`, conservative date parser. Additional bounded Commons file search per selected place/year, ranked by closeness | Creation is not depicted date. Date-free and 18th-century-only/large vague ranges are rejected. Filename matches require manual research before asserting historical identity |
| Wikidata + Wikipedia | Place identity/context | Search, QIDs, article text, neighbourhood and curated relationships | General prose/nearby articles do not prove coexistence in the selected year |
| The London Archives (London Picture Archive) | Original map sheet | **Verified direct item:** [Rocque 1746 London sheet 2E](https://www.londonpicturearchive.org.uk/view-item?i=30771), record 33549, explicitly covering London Bridge. Offered only for historic bridge Q56739974 within 15 years of 1746, with actual year/date gap shown | Links to original record; no image copying or blanket reuse rights; not displayed for the station, modern bridge or other years |
| Historic England NHLE | Protected archaeological leads | Castlefield scheduled-monuments pilot | Scheduling dates are not dates a feature existed |
| NLS historic maps | Source for original map sheets | Existing external viewer researched; broad directory link removed from app | Requires an index matching each precise sheet's footprint, publication/survey date and permalink. No fabricated coverage or dynamic sheet link |
| Library of Congress | Dated maps and images | Public JSON API tested; bounded London Bridge 1720–1750 searches returned zero | Promising no-key adapter, but not integrated. Record dates and geographic association need validation |
| Europeana | Multi-institution objects/images | Search API, rights and date-field schema researched | A free API key is required; not connected. Metadata licence doesn't grant image reuse |
| Archaeology Data Service / local HER | Research and excavations | Research source candidates | Provenance and exact historical period must be verified per record before year matching |

## Ranking proposal

**Hard gates before ranking:** rights, safe URLs, a traceable source, known time basis, and useful place identity/coverage. Scores should never override a failed gate.

Among eligible candidates:

- +60 exact historical entity or verified sheet geography; +25 a same-name archival record with clearly identified locality; no automatic boost for mere geographical proximity
- +40 directly dated same year; otherwise subtract 2 for each year of difference up to the currently permitted gap
- +20 first-hand map / archaeological or archival object with specific provenance; +10 scholarly/contextual secondary lead
- +10 reliable date precision; penalise approximations, broad intervals or a merely title-based relation
- +5 image quality sufficient for mobile, subject to rights and provenance

**Ranking is for discovery order, not for inventing confidence in historical claims.** Keep the component `relationKind` (exact ID, coverage, named subject, nearby only), `dateKind` (created, depicted, surveyed, published, listed) and provenance visible or inspectable. All displayed material must be revisitable at the source.

## Verified user-scenario examples

**London Bridge station, 1735:** main Commons thumbnail is dated **2018**. It fails the 20-year gate and must not dominate the page. Commons period search returned **zero** selected-year images for the station. The separate historic bridge is a related *alternative destination*, not the same station.

**Historic London Bridge (1209–1831), 1735:** a Commons public-domain [Samuel Scott artwork](https://commons.wikimedia.org/wiki/File:Samuel_Scott_(c.1702-1772)_-_Old_London_Bridge_-_1401186_-_National_Trust.jpg) has a documented **1753** creation year — **18 years later**. It is an optional time-near source lead, **not** a view asserted to depict exactly 1735. A curated original-map sheet **Rocque 1746** has verified coverage; the source-specific catalogue link shows **11 years later**. The app does not republish the London Archives image.

**Castlefield, 79 CE:** a modern 2006 archaeological photograph and 2021 canal image are not appropriate contemporary images. They should not be inserted as historical illustrations. Textual archaeological research remains available separately.

## Next research and engineering tasks

- Validate user experience on a mobile screen after selecting a date and changing years.
- Add an adapter for a genuinely dated historical **depiction** where the date depicted has a clear evidence basis independent from the creator's date, and label both.
- Add spatial-and-year catalogue lookup for **NLS specific sheet metadata**, or another trusted heritage-map catalogue that explicitly supports year and bounding box. Only return actual item links after verification; do not use arbitrary viewer URLs as fallback.
- Consider the no-key Library of Congress search, followed by Europeana with an explicit project key, both subject to media/item-level rights.
- Develop a deduplicated, typed record/relation graph: locations, maps, artefacts, documents, people and events. First 1–2-day experiment should produce a few **high-quality traceable** cross-source discoveries, not a huge volume of text.

## 6 November 2026 — Precision-aware periods, not invented point dates

The Wikimedia media adapter now accepts unqualified **century expressions** and bounded year spans. Parsing examples: `17th century` → `[1601,1700]`, `18th century` → `[1701,1800]`, `between 1600 and 1699` → `[1600,1699]`, and `1720–1740` → `[1720,1740]`. The original expression/precision accompanies the candidate, with the interval and uncertainty shown in the UI.

**Eligibility:** century or broad-range imagery can be presented *inside* the supported period only, with a lower ranking than precisely dated imagery; it does not spill 20 years beyond the boundary. A selected date of 1800 is **not** compatible with the 17th century. Image creation date is still not necessarily depiction date. Unbounded dates like `before 1800`, century qualifiers like `early` without a defined convention, and unknown dates are **not** assigned an arbitrary anchor.

The first in-site time strip retains the chosen Wikidata place while moving ±25/100 years. A separate explicit **Find dated changes nearby** action uses bounded 25-year OHM samples to propose up to four named, deduplicated source dates. This is a navigation convenience **not** a comprehensive place chronology or a claim that those dated objects existed throughout the period. The longer OHM results and methodological caveats are collapsed, but accessible.

**Scope limitation:** OpenHistoricalMap's current upstream query still restricts year-matched features to records with numeric start/end tags. Broad-century OHM records may remain absent from the sampled query, even though Commons media now understands them. A future typed chronology must collect and reconcile approximate OHM dates through a separate source-aware process before suggesting them as events.


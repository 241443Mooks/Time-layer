# Codex-ready engineering brief: Adaptive History Engine

**Status: future phase; NOT required for the v0.9 working pilot.** Owner decides when to initiate this larger build. Reference existing product designs in [adaptive-place-history.md](adaptive-place-history.md) and [source-matching.md](source-matching.md).

## Goal

Turn Time-Layer's curated Tower of London history and anonymous-house research demonstration into a **small, extensible, provenance-led research engine**, not a speculative AI-generated history service.

Keep: choose place, hop years, source images, optional map, in-app related discoveries, uncertainty and source rights.

## Existing production foundation

- `/api/place`, `/api/place-search`, `/api/period-images`, `/api/evidence` and `/api/heritage`.
- New `/api/place-history?place=Q62378` is a *sourced curated landmark pilot*, while `?demo=home` is a *method-only residential demo*.
- `public/place-history.js` displays a compact earliest-on-site vs earliest-place distinction and 7 source-backed moment cards (or 4 research steps for home).
- Year jumps dispatch the existing `time-layer-set-year` event. Do not duplicate the date state or break the shared-camera map.
- Existing `docs/source-matching.md` explains rights gates, uncertain dates and original map sheets.

## Implement as reviewed vertical slices

**Phase A — typed chronology and tests**
- Define `Place`, `Provider`, `EvidenceRecord`, `HistoricalClaim`, `Connection`, `TimeRange` (exact, approx, century, bounded interval, unknown) as documented JSON schemas with source IDs and the date's meaning.
- Separate event date, first-record date, document date, original-map publication/survey date, legal designation and time depicted. Never silently infer one from the other.
- Model earliest *site* evidence and earliest *specific building* evidence as distinct queries with a measured, known coverage scope; never claim a global earliest date from the capped Overpass sample.
- Add deterministic tests for 17th century → jump 1700 while retaining interval 1601–1700; BCE calendar years; no date; contradictory source years; 1810–12 ranges; and deliberately false user claims.
- Keep `/api/place-history` backward-compatible.

**Phase B — one additional verified provider**
- Implement one official published heritage/archaeology source adapter with confirmed terms and date field semantics, starting with Tower of London or Castlefield.
- Provider returns structured cited evidence and source URLs, not arbitrary text scraped into claims.
- Demonstrate reconciliation of one named feature across two source IDs; preserve both sources if they disagree.
- Explicit request budget, small spatial bounds, timeout, cache and fallback.

**Phase C — smarter source routing**
- Define classification types `residential-address`, `historic-landmark`, `religious-institution`, `settlement`, `unknown`. Use trusted P31 and jurisdiction signals where present, allow user correction and do not equate same-named places.
- Route to provider manifests based on entity type, historical period, country and available identifiers.
- For UK houses, design an address/UPRN workflow only **after** researching a compliant geocoder and OS/EPC/land-registry data rights. Never expose living residents' personal details or treat sale/valuation as construction date. The anonymous house demo must remain available.
- Unknown profiles return useful source-research routes rather than invented date claims.

**Phase D — rabbit-hole productisation**
- Small in-app cards for source-linked people, places, original maps, photos and artefacts, each retaining a "Why connected?" evidence path.
- One visual timeline with bookmarks and browser history; user should be able to return to the selected place and year.
- Rank only eligible results by identity, relevance of *date type*, distance in time, primary-source quality, and reuse rights. No thumbnail filler.
- Mobile acceptance: few high-value cards above the fold, detailed source/caveat inside a disclosure, no huge text blocks or duplicated map sections.

## Definition of done

1. Known place returns at least 3 independently sourced, type-correct historical moments and a reliable earliest-record claim **limited to searched sources**.
2. Ordinary house workflow accurately states the known/unknown distinction and does not fabricate a property build date.
3. Every shown historical moment has a source permalink, a typed date, an explicit relationship to the place, and an in-app jump (if the date can be represented).
4. Conflicting evidence is preserved, not overwritten by the higher-ranked source.
5. No relevant source remains a valid result. Never show an image or old-map link from an unrelated period.
6. Unit tests, route contract tests, one real browser mobile smoke test, and update README, changelog and source/rate-limit notes.
7. No external action that purchases API subscriptions, publishes property-owner data, or licenses third-party material without explicit approval.

**Non-goal:** exhaustive global archives or a full house genealogy in one PR. Keep PRs small and reviewable.

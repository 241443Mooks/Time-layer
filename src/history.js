// Source-verified adaptive place-history pilot.
// One genuinely documented monument; one deliberately non-factual house
// research route. Never infer an origin date from a source's earliest result.
const TOWER_ID = "Q62378";
const SOURCE = Object.freeze({
  roman: {
    title: "Historic Royal Palaces · Brief History of the Tower",
    url: "https://www.hrp.org.uk/media/1171/tolhistory_v1.pdf"
  },
  construction: {
    title: "Historic Royal Palaces · The White Tower",
    url: "https://www.hrp.org.uk/tower-of-london/whats-on/white-tower/"
  },
  expansion: {
    title: "Historic England · Scheduled monument 1002061",
    url: "https://historicengland.org.uk/listing/the-list/list-entry/1002061"
  },
  mint: {
    title: "Historic Royal Palaces · The Tower's Mint",
    url: "https://www.hrp.org.uk/tower-of-london/history-and-stories/the-towers-mint/"
  },
  tower: {
    title: "Historic Royal Palaces · 50 facts about the Tower",
    url: "https://www.hrp.org.uk/tower-of-london/history-and-stories/50-facts-about-the-tower-of-london/"
  },
  homes: {
    title: "Historic England · Researching a house",
    url: "https://historicengland.org.uk/advice/your-home/your-homes-history/how-to-find-out/history-of-house/"
  },
  archive: {
    title: "The National Archives · Houses research guide",
    url: "https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/houses/"
  }
});

const tower = Object.freeze({
  profile: "landmark",
  entityId: TOWER_ID,
  name: "Tower of London",
  type: "Protected historic fortress",
  status: "curated-pilot",
  statusNote: "A small, sourced chronology selected for this pilot, not every event in the Tower's history.",
  earliestOnSite: {
    label: "Roman city wall · around 200 CE",
    start: 190, end: 210, precision: "circa",
    description: "Roman defensive walls preceded the Norman fortress at this location.",
    source: SOURCE.roman,
    qualifier: "Earliest dated on-site evidence included in this pilot; not the earliest human activity."
  },
  earliestForPlace: {
    label: "White Tower · construction 1078–1100",
    start: 1078, end: 1100, precision: "range",
    description: "Construction of the Norman stone keep, not the beginning of human activity at this site.",
    source: SOURCE.construction,
    qualifier: "Start of the monumental building as described by Historic Royal Palaces."
  },
  chapters: [
    {
      id: "roman-wall", title: "Before the fortress", dateLabel: "Around 200 CE",
      start: 190, end: 210, precision: "circa", jumpYear: 200, type: "Site history",
      text: "A Roman city wall crossed this site long before the Norman castle.",
      source: SOURCE.roman, basis: "Estimated construction period of wall"
    },
    {
      id: "white-tower", title: "The White Tower rises", dateLabel: "1078–1100",
      start: 1078, end: 1100, precision: "range", jumpYear: 1100, type: "Building",
      text: "William the Conqueror's great stone keep was built over this period.",
      source: SOURCE.construction, basis: "Construction period"
    },
    {
      id: "medieval-expansion", title: "A bigger fortress", dateLabel: "13th century",
      start: 1201, end: 1300, precision: "century", jumpYear: 1300, type: "Building",
      text: "Henry III and Edward I developed the defensive walls and medieval palace.",
      source: SOURCE.expansion, basis: "Broad historical building phase"
    },
    {
      id: "mint", title: "Coins behind the walls", dateLabel: "Around 1279",
      start: 1270, end: 1285, precision: "circa", jumpYear: 1279, type: "Institution",
      text: "The Royal Mint moved into the security of the Tower.",
      source: SOURCE.mint, basis: "Approximate start of institutional activity"
    },
    {
      id: "peasant-revolt", title: "The walls are breached", dateLabel: "1381",
      start: 1381, end: 1381, precision: "year", jumpYear: 1381, type: "Event",
      text: "The Peasants' Revolt breached the fortress's defences.",
      source: SOURCE.tower, basis: "Year of event"
    },
    {
      id: "mint-departs", title: "The Mint moves out", dateLabel: "1810–1812",
      start: 1810, end: 1812, precision: "range", jumpYear: 1812, type: "Institution",
      text: "Minting operations transferred from the Tower to nearby Tower Hill.",
      source: SOURCE.tower, basis: "Transition period, not a single instant"
    },
    {
      id: "storehouse-fire", title: "A great fire", dateLabel: "1841",
      start: 1841, end: 1841, precision: "year", jumpYear: 1841, type: "Event",
      text: "A fire destroyed the Grand Storehouse on 30 October.",
      source: SOURCE.tower, basis: "Recorded event date"
    }
  ]
});

const home = Object.freeze({
  profile: "home-research-demo",
  entityId: null,
  name: "How would we research an ordinary house?",
  type: "Anonymous demonstration · no real address selected",
  status: "method-demo",
  statusNote: "These are places to look for evidence, not dated events proven to have occurred at any particular house.",
  earliestOnSite: null,
  earliestForPlace: null,
  chapters: [
    {
      id: "building-plans", title: "Find building plans",
      dateLabel: "Often late 19th century onward",
      type: "Research route", precision: "source-period",
      text: "Local council building-control archives may hold plans or applications. A plan is not itself proof that construction was completed.",
      source: SOURCE.homes, basis: "Period in which this class of record may exist"
    },
    {
      id: "first-map", title: "Find its first mapped appearance",
      dateLabel: "OS maps · often 1840s onward",
      type: "Research route", precision: "source-period",
      text: "Compare georeferenced survey sheets for the exact plot. The earliest map showing a building is evidence it existed by that survey, not its build date.",
      source: SOURCE.homes, basis: "General archive coverage, not a property date"
    },
    {
      id: "tithe", title: "Check earlier land use",
      dateLabel: "Tithe surveys · 1836–1850",
      type: "Research route", precision: "source-period",
      text: "Tithe maps and apportionments may establish plot boundaries and land use before the present house existed.",
      source: SOURCE.archive, basis: "General survey period"
    },
    {
      id: "valuation", title: "Trace the plot in 1910",
      dateLabel: "Valuation Survey · 1910–1915",
      type: "Research route", precision: "source-period",
      text: "Use valuation maps and field books to identify a plot and follow archival references. This is not the date the house was built.",
      source: SOURCE.archive, basis: "General survey period"
    }
  ]
});

function json(payload, status = 200, cache = 900) {
  return Response.json(payload, {status, headers: {
    "Cache-Control": cache ? "public, max-age=" + cache : "no-store",
    "X-Content-Type-Options": "nosniff"
  }});
}

export async function placeHistory(request) {
  if (request.method !== "GET") return json({error:"Only GET is supported."},405,0);
  const url = new URL(request.url);
  const demo = url.searchParams.get("demo");
  const id = url.searchParams.get("place");
  if (demo && demo !== "home") return json({error:"Unknown research demonstration."},400,0);
  if (id && !/^Q[1-9]\d{0,11}$/.test(id)) return json({error:"Invalid Wikidata identity."},400,0);
  if (demo === "home") return json(home);
  if (id === TOWER_ID || id === "Q56184945") return json(tower);
  return json({
    profile:"unresearched",
    entityId:id || null,
    name:null,
    type:"Place not yet profiled",
    status:"unknown",
    statusNote:"No verified place-specific chronology is available in this pilot. Absence of records here does not mean the place has no history.",
    earliestOnSite:null,
    earliestForPlace:null,
    chapters:[]
  });
}

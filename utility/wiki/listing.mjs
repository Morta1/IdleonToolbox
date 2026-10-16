// A kind's listing: its rows and the columns a reader compares them by. Data-free and importable
// from plain node, so the page builds it at export time and the tests read the same function.
import { costCurrency, costsAt, firstLevel, levelledText, summaryLevel } from './effects.mjs';
import { inListing } from './kinds.mjs';
import { NO_MAX } from './listing-sort.mjs';
import { slugify } from './names.mjs';
import { FACET_MAX, facetReader, facetValue } from './grouping.js';

// A column has to describe the kind, not a corner of it: a value most rows leave blank reads as a gap.
export const COLUMN_SHARE = 0.5;

// Name plus five values is what fits beside each other at md widths before the name wraps word by word.
export const MAX_DATA_COLUMNS = 5;

// A text column is a short label (a tree, a rarity); past this median length it is a sentence.
export const TEXT_MAX_LENGTH = 20;

// The keys the listing itself names. A field whose label would take one gets a suffix instead.
const FIXED_KEYS = ['name', 'category', 'effect', 'cost', 'max-level'];

const EFFECT_NOTE = 'At the first level.';

// These kinds keep their numbers in `stats` and top-level fields that no rule can tell from the indexes
// beside them (order, companionIndex), so they name their columns. The labels are the entity page's own,
// so one value reads the same in both places. `facet` names the band column where "Category" would mislead.
export const KIND_COLUMNS = {
  item: {
    facet: 'Type',
    columns: [
      { key: 'level', label: 'Level', format: 'amount', value: (node) => node.stats?.lvReqToEquip || null },
      { key: 'sell-price', label: 'Sell Price', format: 'coins', value: (node) => node.sellPrice || null }
    ]
  },
  monster: {
    facet: 'Section',
    columns: [
      { key: 'health', label: 'Health', format: 'notate', value: (node) => node.stats?.health || null },
      { key: 'experience', label: 'Experience', format: 'notate', value: (node) => node.stats?.experience || null },
      { key: 'attack', label: 'Attack', format: 'notate', value: (node) => node.stats?.attack || null },
      { key: 'def-for-0', label: 'Def for 0', format: 'notate', value: (node) => node.stats?.defence || null }
    ]
  },
  npc: { facet: 'World' },
  pet: {
    columns: [
      { key: 'power', label: 'Power', format: 'amount', value: (node) => node.tourPower || null },
      { key: 'upgraded-power', label: 'Upgraded power', format: 'amount', value: (node) => node.upgradedTourPower || null },
      { key: 'pet-mart-cost', label: 'Pet Mart+ cost', format: 'crystals', value: (node) => node.upgradeCost || null }
    ]
  },
  bundle: {
    columns: [
      { key: 'price', label: 'Price', format: 'usd', value: (node) => node.price || null },
      { key: 'gems', label: 'Gems', format: 'gems', value: (node) => node.gems || null }
    ]
  }
};

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;

const fieldOf = (node, label) => node.fields?.find((field) => field.label === label && field.value != null) ?? null;

const effectText = (node) => levelledText(node, summaryLevel(node));

// `currency` is the word the page prints, singular at exactly 1 ("1 Meat Slice"); `currencyKey` is the currency
// itself, so the sort keeps every amount of one currency in one group.
const costCell = (node) => {
  const costs = costsAt(node, firstLevel(node))
    .filter((cost) => cost.value != null)
    .map((cost) => ({
      amount: cost.value,
      currency: costCurrency(cost, cost.value),
      currencyKey: cost.currency,
      ...(cost.currencyIcon ? { icon: cost.currencyIcon } : {})
    }));
  return costs.length ? costs : null;
};

const capOf = (node) => {
  if (node.effect?.noMax) return NO_MAX;
  return typeof node.effect?.cap === 'number' ? node.effect.cap : null;
};

// Steps 3 to 6 of the rule: the effect, the first level's cost, the max level, then the fields, numbers first.
const ruleColumns = (rows, share, distinct) => {
  const columns = [];
  if (share(effectText) >= COLUMN_SHARE) {
    const isEffect = share((node) => node.effect) >= COLUMN_SHARE;
    columns.push({ key: 'effect', label: isEffect ? 'Effect' : 'Description', type: 'effect', sortable: false, ...(isEffect ? { note: EFFECT_NOTE } : {}) });
  }
  const firstCost = (node) => costCell(node)?.[0].amount ?? null;
  if (share(firstCost) >= COLUMN_SHARE && distinct(firstCost) >= 2) columns.push({ key: 'cost', label: 'Cost', type: 'cost', sortable: true });
  if (share(capOf) >= COLUMN_SHARE && distinct(capOf) >= 2) columns.push({ key: 'max-level', label: 'Max level', type: 'max', sortable: true });

  const labels = [...new Set(rows.flatMap((node) => (node.fields || []).map((field) => field.label)))];
  const numbers = [];
  const texts = [];
  for (const label of labels) {
    const valueOf = (node) => fieldOf(node, label)?.value ?? null;
    if (share(valueOf) < COLUMN_SHARE || distinct(valueOf) < 2) continue;
    const carried = rows.map((node) => fieldOf(node, label)).filter(Boolean);
    const values = carried.map((field) => field.value);
    const formats = [...new Set(carried.map((field) => field.format))];
    if (values.every((value) => typeof value === 'number')) {
      if (formats.length === 1) numbers.push({ label, type: 'number', sortable: true, ...(formats[0] ? { format: formats[0] } : {}) });
    } else if (values.every((value) => typeof value === 'string')
      && !carried.some((field) => field.links?.length)
      && distinct(valueOf) <= Math.min(FACET_MAX, rows.length / 2)
      && median(values.map((value) => value.length)) <= TEXT_MAX_LENGTH) {
      texts.push({ label, type: 'text', sortable: true });
    }
  }
  const taken = new Set(FIXED_KEYS);
  const fields = [...numbers, ...texts].map((column) => {
    let key = slugify(column.label);
    while (taken.has(key)) key = `${key}-field`;
    taken.add(key);
    return { key, ...column };
  });
  return [...columns, ...fields];
};

// The columns a kind's listing shows, in order: its facet, then its override columns or the rule's.
export const listingColumns = (kind, rows) => {
  const share = (valueOf) => rows.filter((node) => valueOf(node) != null).length / rows.length;
  const distinct = (valueOf) => new Set(rows.map(valueOf).filter((value) => value != null).map(String)).size;
  const { byWorld, facetOf } = facetReader(rows);
  const override = KIND_COLUMNS[kind];
  const columns = [];
  if (distinct(facetOf) >= 2) {
    columns.push({ key: 'category', label: override?.facet ?? 'Category', type: 'facet', sortable: true, ...(byWorld ? { byWorld } : {}) });
  }
  if (override?.columns) columns.push(...override.columns.map(({ key, label, format }) => ({ key, label, type: 'number', sortable: true, format })));
  else columns.push(...ruleColumns(rows, share, distinct));
  return columns.slice(0, MAX_DATA_COLUMNS);
};

const cellOf = (column, node) => {
  const override = KIND_COLUMNS[node.kind]?.columns?.find((candidate) => candidate.key === column.key);
  if (override) return override.value(node);
  if (column.type === 'facet') return facetValue(node, Boolean(column.byWorld));
  if (column.type === 'effect') return effectText(node);
  if (column.type === 'cost') return costCell(node);
  if (column.type === 'max') return capOf(node);
  return fieldOf(node, column.label)?.value;
};

// One value per column, aligned to `columns` so the payload does not repeat key names per row.
export const listingCells = (columns, node) => columns.map((column) => cellOf(column, node) ?? null);

const listingRows = (graph, kind) => Object.entries(graph.nodes)
  .filter(([, node]) => node.kind === kind && inListing(node))
  .map(([id, node]) => ({
    id,
    label: (node.name || node.rawName).replace(/_/g, ' '),
    // What tells this row from another of the same name; a unique page carries none.
    ...(node.disambig ? { disambig: node.disambig } : {}),
    // category rides along so the listing can offer a facet the data actually has: seven worlds
    // for maps, five kinds for monsters, 112 item types behind a select.
    node: {
      kind: node.kind,
      rawName: node.rawName,
      name: node.name,
      icon: node.icon ?? null,
      slug: node.slug,
      category: node.category ?? null,
      // A bundle's art is a wide shop banner carrying its name, price and contents, and the card
      // is built around that. A Pet Mart pack has none: just its pet's sprite. So the four things
      // the banner would have shown travel with it and the card draws them itself.
      // A Starter Pack offer card is portrait art, which the wide banner card would blow up, so
      // it takes the Pet Mart treatment too.
      ...(node.petMart || node.starterOffer ? {
        ...(node.petMart ? { petMart: true } : { starterOffer: true }),
        petName: node.petName ?? null,
        price: node.price ?? null,
        gems: node.gems ?? null,
        petCrystals: node.petCrystals ?? null
      } : {}),
      // Vials and bubbles unlock in a fixed sequence, and that sequence is how they are read.
      order: node.order ?? null,
      // Monsters and NPCs band by world, which is a different axis from their category.
      world: node.world ?? null,
      // Which bestiary section a monster reads under, which is a world for most of them and
      // Bosses, Events, Dungeon or The Rift for the ones the game places nowhere.
      section: node.section ?? null
    }
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// The rows are filtered with inListing, the predicate the hub counts with, so a listing always
// holds the number of rows its tile promises.
export const listingEntries = (graph, kind) => {
  const columns = listingColumns(kind, Object.values(graph.nodes).filter((node) => node.kind === kind && inListing(node)));
  const entries = listingRows(graph, kind).map((entry) => ({ ...entry, cells: listingCells(columns, graph.nodes[entry.id]) }));
  return { columns, entries };
};

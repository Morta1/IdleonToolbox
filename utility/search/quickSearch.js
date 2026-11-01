import { getPageIcon, PAGE_BY_URL, PAGE_INDEX } from '@utility/pageIndex';
import { BREAKDOWN_SEARCH, breakdownKey } from '@utility/breakdownSearch';
import { KIND_LABELS } from '@utility/wiki/kind-labels.mjs';
import { entityHref } from '@utility/wiki/page-graph';

// The quick search's matching and grouping (Search board), data-free so node tests read it and every page
// can import it. A row is { key, kind, label, note, icon, href: { pathname, query }, tabs?, filter? }.

// More than this buries the pages under stats whenever a word fits both
export const BREAKDOWNS_SHOWN = 3;

const escapeRegExp = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word starts only: 'dr' finds Drop rate, not cauldron or Wardrobe. Each typed word may land in a different
// field, so 'refinery cycle' finds a cycle time through its page name.
export const wordMatcher = (term) => {
  const words = term.trim().toLowerCase().split(/\s+/).filter(Boolean)
    .map((word) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(word)}`, 'i'));
  return (texts) => words.length > 0 && words.every((word) => texts.some((text) => text && word.test(text)));
};

// What a page row can open: the page, each tab, each nested tab. A search that names a tab lands on it
// ("meals" opens Cooking's Meals tab); the row still lists every tab as a link.
const targetsOf = (page) => [
  { texts: [page.label, page.section], query: {}, note: page.section },
  ...page.tabs.map(({ tab }) => ({ texts: [page.label, tab, page.section], query: { t: tab }, note: `${page.section} · ${tab} tab` })),
  ...page.nestedTabs.flatMap(({ tab, nestedTab, nestedTabs = [] }) => [
    { texts: [page.label, tab, nestedTab, page.section], query: { t: tab, nt: nestedTab }, note: `${page.section} · ${tab}: ${nestedTab}` },
    ...nestedTabs.map((deep) => ({
      texts: [page.label, tab, nestedTab, deep, page.section], query: { t: tab, nt: nestedTab, dnt: deep },
      note: `${page.section} · ${tab}: ${nestedTab}: ${deep}`
    }))
  ])
];

export const pageRow = (page, target = targetsOf(page)[0]) => ({
  key: `${page.url}?${new URLSearchParams(target.query)}`,
  kind: page.group === 'tools' ? 'tool' : 'page',
  label: page.label,
  note: target.note,
  icon: getPageIcon({ url: page.url, tab: target.query.t, nestedTab: target.query.nt }),
  href: { pathname: page.url, query: target.query },
  tabs: page.tabs.map(({ tab }) => ({ label: tab, href: { pathname: page.url, query: { t: tab } } }))
});

const BREAKDOWN_ROWS = BREAKDOWN_SEARCH.map(({ statName, label, aliases, url, query, scope, filter, icon }) => {
  const page = PAGE_BY_URL[url];
  return {
    key: `breakdown:${url}:${breakdownKey(statName)}`,
    kind: 'breakdown',
    label: label ?? statName,
    note: [page?.label, query?.t ? `${query.t} tab` : null, scope].filter(Boolean).join(' · '),
    keywords: aliases?.join(' ') ?? '',
    filter,
    icon: icon ?? page?.icon,
    href: { pathname: url, query: { ...query, breakdown: breakdownKey(statName) } }
  };
});

const rowsOf = (group, matches) => PAGE_INDEX.filter((page) => page.group === group).flatMap((page) => {
  const target = targetsOf(page).find(({ texts }) => matches(texts));
  return target ? [pageRow(page, target)] : [];
});

// Optimal string alignment: an insertion, a deletion, a substitution or a swap of two neighbours costs 1.
const editDistance = (a, b) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
    }
  }
  return rows[a.length][b.length];
};

// How far one typed word may stray: none under 3 letters, 1 up to 5, 2 from 6.
const allowance = (word) => (word.length >= 6 ? 2 : word.length >= 3 ? 1 : 0);

// The closest word start in the texts for one typed word: { distance, word }, distance 0 for a word start,
// null when every word is too far. Compared with each word's first n-1 to n+1 letters, so a partial word
// ("cookng m") still lands. The first of equally close words wins, so a label beats its aliases.
const closestWord = (typed, texts) => {
  let best = null;
  for (const text of texts) {
    for (const word of String(text ?? '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
      if (word.startsWith(typed)) return { distance: 0, word };
      for (let length = Math.max(1, typed.length - 1); length <= typed.length + 1; length++) {
        const distance = editDistance(typed, word.slice(0, length));
        if (distance <= allowance(typed) && (best === null || distance < best.distance)) best = { distance, word };
      }
    }
  }
  return best;
};

// The candidates closest to a search that matched nothing: every typed word within reach, fewest edits in
// total, in the order given. matched is what the first of them read the search as ("drop rate" for "drp rate").
const closest = (words, candidates, textsOf) => {
  const scored = candidates.flatMap((candidate) => {
    let total = 0;
    const read = [];
    for (const typed of words) {
      const hit = closestWord(typed, textsOf(candidate));
      if (!hit) return [];
      total += hit.distance;
      read.push(hit.word);
    }
    return [{ candidate, total, matched: read.join(' ') }];
  });
  const fewest = Math.min(...scored.map(({ total }) => total));
  const best = scored.filter(({ total }) => total === fewest);
  return { candidates: best.map(({ candidate }) => candidate), matched: best[0]?.matched };
};

// Pages and Breakdowns (pages first when a page's name starts with what was read), then Tools.
const grouped = ({ pages, breakdowns, tools, read, allBreakdowns }) => {
  const hidden = allBreakdowns ? 0 : Math.max(0, breakdowns.length - BREAKDOWNS_SHOWN);
  const pageGroup = { key: 'pages', title: 'Pages', rows: pages };
  const breakdownGroup = { key: 'breakdowns', title: 'Breakdowns', rows: breakdowns.slice(0, breakdowns.length - hidden), hidden };
  const pagesFirst = pages.some((row) => row.label.toLowerCase().startsWith(read));
  const groups = [...(pagesFirst ? [pageGroup, breakdownGroup] : [breakdownGroup, pageGroup]), { key: 'tools', title: 'Tools', rows: tools }];
  return groups.filter((group) => group.rows.length);
};

// When nothing matches, the rows closest to the search (Search board, "Forgiving"), over one list: each page's
// targets (a page keeps its first target in reach), the breakdowns, the tools. Never mixed with exact rows.
const closeMatches = (q, allBreakdowns) => {
  const words = q.split(/\s+/).filter(Boolean);
  const targetsIn = (group) => PAGE_INDEX.filter((page) => page.group === group)
    .flatMap((page) => targetsOf(page).map((target) => ({ page, target })));
  const candidates = [...targetsIn('pages'), ...BREAKDOWN_ROWS.map((row) => ({ row })), ...targetsIn('tools')];
  const { candidates: best, matched } = closest(words, candidates,
    ({ row, target }) => (row ? [row.label, row.keywords, row.note] : target.texts));
  if (!best.length) return null;
  const firstPerPage = (group) => best.filter(({ page }) => page?.group === group)
    .filter(({ page }, index, list) => list.findIndex((other) => other.page === page) === index)
    .map(({ page, target }) => pageRow(page, target));
  const breakdowns = best.filter(({ row }) => row).map(({ row }) => row);
  return {
    groups: grouped({ pages: firstPerPage('pages'), breakdowns, tools: firstPerPage('tools'), read: matched, allBreakdowns }),
    closeTo: matched
  };
};

// The toolbox's own results, grouped as the panel shows them: Pages and Breakdowns (pages first when a page's
// name starts with the search, the stat otherwise), then Tools. count is the rows found, hidden ones included;
// close matches (closeTo set) leave it at 0, so GA still sees the miss.
export const searchToolbox = (term, { allBreakdowns = false } = {}) => {
  const q = term.trim().toLowerCase();
  if (!q) return { groups: [], count: 0 };
  const matches = wordMatcher(q);
  const pages = rowsOf('pages', matches);
  const tools = rowsOf('tools', matches);
  // Breakdowns named like the search come before the ones that only live on a matching page
  const named = BREAKDOWN_ROWS.filter((row) => matches([row.label, row.keywords]));
  const breakdowns = [...named, ...BREAKDOWN_ROWS.filter((row) => !named.includes(row) && matches([row.label, row.note, row.keywords]))];
  const count = pages.length + breakdowns.length + tools.length;
  if (!count) return { ...(closeMatches(q, allBreakdowns) ?? { groups: [] }), count: 0 };
  return { groups: grouped({ pages, breakdowns, tools, read: q, allBreakdowns }), count };
};

// Recent (Search board): the pages a player has left, newest first, one per page with the tab it was on,
// on this device only. Recorded on the way out, so the page on screen is never its own suggestion.
export const RECENT_KEPT = 10;
export const RECENT_SHOWN = 5;
export const PINS_SHOWN = 5;

export const recentEntry = (asPath) => {
  const [path, query = ''] = (asPath ?? '').split('#')[0].split('?');
  const page = PAGE_BY_URL[path];
  if (!page) return null;
  const tab = new URLSearchParams(query).get('t');
  return tab ? { url: page.url, tab } : { url: page.url };
};

export const addRecent = (list, entry) => [entry, ...(list ?? []).filter((old) => old.url !== entry.url)].slice(0, RECENT_KEPT);

const savedRow = ({ url, tab, nestedTab, deeplyNestedTab, name }) => {
  const page = PAGE_BY_URL[url];
  const query = Object.fromEntries([['t', tab], ['nt', nestedTab], ['dnt', deeplyNestedTab]].filter(([, value]) => value));
  return {
    key: `saved:${url}?${new URLSearchParams(query)}`,
    kind: 'page',
    label: page?.label ?? String(name ?? url).replace('-', ' '),
    note: [page?.section, tab ? `${tab} tab` : null].filter(Boolean).join(' · '),
    icon: getPageIcon({ url, tab, nestedTab }),
    href: { pathname: url, query }
  };
};

// The empty box: pinned pages first (the player's choice), then up to 5 recent ones that are neither pinned
// nor the page on screen (a guess). A section with nothing in it is not shown.
export const emptyBox = ({ pins = [], recent = [], currentUrl }) => {
  const pinned = new Set((pins ?? []).map((pin) => pin.url));
  return {
    pins: (pins ?? []).map(savedRow),
    recent: (recent ?? []).filter((entry) => PAGE_BY_URL[entry.url] && !pinned.has(entry.url) && entry.url !== currentUrl)
      .slice(0, RECENT_SHOWN).map(savedRow)
  };
};

// The wiki's names (Search board: "the wiki never takes over"): last, 3 strong matches, then the rest on
// request. Strong: the name is the search, starts with it, or has every typed word at a word start ("mush"
// finds Green Mushroom), in that order, each in the index's order. Entries without a page are skipped.
export const WIKI_SHOWN = 3;
export const WIKI_MAX = 30;

export const wikiMatches = (entries, term) => {
  const q = term.trim().toLowerCase();
  if (!entries || q.length < 2) return [];
  const matches = wordMatcher(q);
  const exact = [];
  const prefix = [];
  const words = [];
  for (const entry of entries) {
    if (!entry.slug) continue;
    const label = entry.label.toLowerCase();
    if (label === q) exact.push(entry);
    else if (label.startsWith(q)) prefix.push(entry);
    else if (matches([entry.label])) words.push(entry);
  }
  return [...exact, ...prefix, ...words].slice(0, WIKI_MAX);
};

// A wiki row: the name (and what tells two of the same name apart), its kind as the line, the entity's page.
export const wikiRow = (entry) => ({
  key: `wiki:${entry.id}`,
  kind: 'wiki',
  label: entry.label,
  disambig: entry.disambig,
  note: KIND_LABELS[entry.kind] || entry.kind,
  entry,
  href: { pathname: entityHref(entry), query: {} }
});

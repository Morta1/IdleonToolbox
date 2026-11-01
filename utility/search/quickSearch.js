import { getPageIcon, PAGE_BY_URL, PAGE_INDEX } from '@utility/pageIndex';
import { BREAKDOWN_SEARCH, breakdownKey } from '@utility/breakdownSearch';

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

// The toolbox's own results, grouped as the panel shows them: Pages and Breakdowns (pages first when a page's
// name starts with the search, the stat otherwise), then Tools. count is the rows found, hidden ones included.
export const searchToolbox = (term, { allBreakdowns = false } = {}) => {
  const q = term.trim().toLowerCase();
  if (!q) return { groups: [], count: 0 };
  const matches = wordMatcher(q);
  const pages = rowsOf('pages', matches);
  const tools = rowsOf('tools', matches);
  // Breakdowns named like the search come before the ones that only live on a matching page
  const named = BREAKDOWN_ROWS.filter((row) => matches([row.label, row.keywords]));
  const breakdowns = [...named, ...BREAKDOWN_ROWS.filter((row) => !named.includes(row) && matches([row.label, row.note, row.keywords]))];
  const hidden = allBreakdowns ? 0 : Math.max(0, breakdowns.length - BREAKDOWNS_SHOWN);
  const pageGroup = { key: 'pages', title: 'Pages', rows: pages };
  const breakdownGroup = { key: 'breakdowns', title: 'Breakdowns', rows: breakdowns.slice(0, breakdowns.length - hidden), hidden };
  const pagesFirst = pages.some((row) => row.label.toLowerCase().startsWith(q));
  const groups = [...(pagesFirst ? [pageGroup, breakdownGroup] : [breakdownGroup, pageGroup]), { key: 'tools', title: 'Tools', rows: tools }];
  return { groups: groups.filter((group) => group.rows.length), count: pages.length + breakdowns.length + tools.length };
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

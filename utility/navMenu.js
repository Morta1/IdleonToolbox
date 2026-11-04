import { PAGES } from '@components/constants';
import { PAGE_BY_URL, PAGE_INDEX } from '@utility/pageIndex';

// The Account menu's groups (Layout boards): the seven worlds in game order, then the account-wide groups. Misc is
// two groups in the menu, Basics and Activities; their URLs stay /account/misc/... .
const BASICS = ['general', 'storage', 'quests', 'constellations', 'upgrade-vault'];
const inFolder = (folder) => PAGE_INDEX.filter(({ url }) => url.startsWith(`/account/${folder}/`));
const lastSegment = (url) => url.split('/').at(-1);

const ACCOUNT_GROUPS = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    key: `world-${n}`, label: `World ${n}`, row: 'worlds', icon: PAGES.ACCOUNT[`world ${n}`].icon, pages: inFolder(`world-${n}`)
  })),
  {
    key: 'basics', label: 'Basics', row: 'account', icon: PAGES.ACCOUNT.misc.icon,
    pages: inFolder('misc').filter(({ url }) => BASICS.includes(lastSegment(url)))
  },
  {
    key: 'activities', label: 'Activities', row: 'account', icon: 'data/DungeonA7',
    pages: inFolder('misc').filter(({ url }) => !BASICS.includes(lastSegment(url)))
  },
  { key: 'classes', label: 'Classes', row: 'account', icon: PAGES.ACCOUNT['class-specific'].icon, pages: inFolder('class-specific') },
  { key: 'task-board', label: 'Task Board', row: 'account', icon: PAGES.ACCOUNT['task board'].icon, pages: inFolder('task-board') },
  { key: 'clickers', label: 'Clickers', row: 'account', icon: PAGES.ACCOUNT.clickers.icon, pages: inFolder('clickers') },
  {
    key: 'premium', label: 'Premium', row: 'account', icon: PAGES.ACCOUNT['prem-currency'].icon,
    style: PAGES.ACCOUNT['prem-currency'].style, pages: inFolder('prem-currency')
  }
].map((group) => ({ ...group, menu: 'account' }));

// Grouped by purpose (phase 4 Decision 2).
const tools = (slugs) => slugs.map((slug) => PAGE_BY_URL[`/tools/${slug}`]);
const TOOLS_GROUPS = [
  { key: 'planners', label: 'Planners', pages: tools(['item-planner', 'god-planner', 'material-tracker', 'wardrobe']) },
  {
    key: 'calculators', label: 'Calculators',
    pages: tools(['active-stuff-calculator', 'guaranteed-drop-calculator', 'bone-joe-calculator', 'sampling-companion', 'formulas'])
  },
  { key: 'browse', label: 'Browse', pages: tools(['card-search', 'item-browser', 'builds']) }
].map((group) => ({ ...group, menu: 'tools', icon: group.pages[0].icon }));

export const MENUS = { account: ACCOUNT_GROUPS, tools: TOOLS_GROUPS };

// The bar, left to right. account and tools open their menu; the rest are links.
export const TOP_NAV = ['dashboard', 'characters', 'account', 'tools', 'guilds', 'statistics', 'leaderboards', 'wiki'];

// A group row's label where the page's own name does not fit; the link's accessible name holds it and the full name.
export const SHORT_LABELS = { '/account/world-7/legend-talents': 'Legends', '/account/world-7/zenith-market': 'Zenith' };

const GROUP_BY_URL = Object.fromEntries([...ACCOUNT_GROUPS, ...TOOLS_GROUPS]
  .flatMap((group) => group.pages.map(({ url }) => [url, group])));

// The group a route belongs to (router.pathname), or null off the account and tool pages.
export const groupOf = (pathname) => GROUP_BY_URL[pathname] ?? null;

export const groupByKey = (key) => [...ACCOUNT_GROUPS, ...TOOLS_GROUPS].find((group) => group.key === key) ?? null;

// A group row's split by the room it has, from an estimate of each part that never comes out short of the real one: a
// pill is its label (Roboto 500 at 14 px, body2's 0.15 px letter spacing), a 22 px icon and 8 px to it, 12 px of
// padding each side and 4 px to the next; the group's button its caps label (13 px at 600, 0.04em spacing), its padding,
// chevron and 8 px to the first pill; More 94 px and 8.2 px per digit of its count. A label's width sums each
// character's measured advance, plus 2% in case another font draws it. The current page always shows; the group's other
// pages follow in order while they fit with More beside them, and More goes where all of them fit, so the current page
// takes the last slot when it sits further along. Pure: the row reads it through container queries on its own width,
// which is the page's real width at every size (the frame's rail rule included), so the export, the first render and
// every later one agree and nothing reflows after hydration.
// showFrom: per page url, the narrowest row (px) that shows it. more: [hidden count, from, below] ranges for More's
// count. moreFrom: the width from which every page fits and More goes. dialogBelow: below it More hides more than 8
// pages and opens a dialog instead of a menu (Overlays board, "Kind by job"); 0 when it never does.
const LOWER = [7.55, 7.87, 7.31, 7.89, 7.5, 4.94, 7.94, 7.78, 3.57, 3.51, 7.3, 3.57, 12.2, 7.79, 7.94, 7.87, 7.92, 4.95,
  7.21, 4.66, 7.79, 6.95, 10.39, 7.04, 6.86, 7.04];
const UPPER = [9.28, 8.84, 9.14, 9.14, 7.91, 7.71, 9.54, 9.93, 3.96, 7.78, 8.85, 7.56, 12.24, 9.93, 9.65, 8.93, 9.65, 8.81,
  8.48, 8.53, 9.16, 9.04, 12.33, 8.84, 8.55, 8.44];
const charWidth = (char) => {
  const code = char.charCodeAt(0);
  if (code >= 97 && code <= 122) return LOWER[code - 97];
  if (code >= 65 && code <= 90) return UPPER[code - 65];
  if (code >= 48 && code <= 57) return 7.96;
  return char === ' ' ? 3.48 : 9;
};
const textWidth = (label, scale, spacing) => [...label].reduce((sum, char) => sum + charWidth(char) * scale + spacing, 0) * 1.02;
const pillWidth = (label) => 58 + textWidth(label, 1, 0.15);
const buttonWidth = (label) => 57 + textWidth(label.toUpperCase(), (13 / 14) * 1.02, 0.52);
const moreWidth = (hidden) => 94 + 8.2 * String(hidden).length;
export const rowSplit = (group, currentUrl) => {
  const pages = group.pages;
  const count = pages.length;
  const width = (page) => pillWidth(SHORT_LABELS[page.url] ?? page.label);
  const current = pages.find(({ url }) => url === currentUrl) ?? pages[0];
  const others = pages.filter((page) => page !== current);
  // needs[k]: the room k pills take, the current page and the first k - 1 others, with More beside them
  let used = buttonWidth(group.label) + width(current);
  const needs = [0, used + moreWidth(count - 1)];
  others.forEach((page) => {
    used += width(page);
    needs.push(used + moreWidth(count - needs.length));
  });
  const all = Math.ceil(used);
  const from = (shown) => (shown >= count ? all : Math.ceil(Math.min(used, needs[shown])));
  const more = [];
  for (let shown = 1; shown < count; shown += 1) {
    const low = shown === 1 ? 0 : from(shown);
    const high = from(shown + 1);
    if (high > low) more.push([count - shown, low, high]);
  }
  return {
    showFrom: Object.fromEntries([[current.url, 0], ...others.map((page, index) => [page.url, from(index + 2)])]),
    more,
    moreFrom: all,
    dialogBelow: count - 1 > 8 ? from(count - 8) : 0
  };
};

// Tools that need no save: usePageDataLoading lets them render without one. Moved from the nav drawer.
export const offlineTools = { cardSearch: true, builds: true, itemBrowser: true, itemPlanner: true, wardrobe: true };

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

// A group row's label where the page's own name does not fit; the full name stays the link's accessible name.
export const SHORT_LABELS = { '/account/world-7/legend-talents': 'Legends', '/account/world-7/zenith-market': 'Zenith' };

const GROUP_BY_URL = Object.fromEntries([...ACCOUNT_GROUPS, ...TOOLS_GROUPS]
  .flatMap((group) => group.pages.map(({ url }) => [url, group])));

// The group a route belongs to (router.pathname), or null off the account and tool pages.
export const groupOf = (pathname) => GROUP_BY_URL[pathname] ?? null;

export const groupByKey = (key) => [...ACCOUNT_GROUPS, ...TOOLS_GROUPS].find((group) => group.key === key) ?? null;

// How many of a group's pages a row holds before More, from an estimate of each pill (14/500 Roboto at about 7.6 px a
// character, a 22 px icon, 12 px of padding each side, 4 px between). Pure, so the build and the client agree and the
// row hides the rest by CSS: nothing reflows after hydration. The group's own button takes at least 112 px (its caps
// label at about 7.5 px a character, the chevron and padding), More 104.
const pillWidth = (label) => 22 + 8 + 24 + 4 + label.length * 7.6;
export const rowFit = (group, width) => {
  const labels = group.pages.map(({ url, label }) => SHORT_LABELS[url] ?? label);
  const button = Math.max(112, group.label.length * 7.5 + 52);
  const fits = (room) => {
    let used = 0;
    return labels.findIndex((label) => (used += pillWidth(label)) > room);
  };
  const all = fits(width - button);
  return all === -1 ? labels.length : Math.max(1, fits(width - button - 104));
};

// Tools that need no save: usePageDataLoading lets them render without one. Moved from the nav drawer.
export const offlineTools = { cardSearch: true, builds: true, itemBrowser: true, itemPlanner: true, wardrobe: true };

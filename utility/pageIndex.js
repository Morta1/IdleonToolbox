import { PAGES } from '@components/constants';

const toKebabCase = (str) => str
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/\s+/g, '-')
  .toLowerCase();

// 'friendsStats' -> 'Friends Stats', 'world 4' -> 'World 4'. The quick search's labels since it shipped;
// no String.prototype helper, so node tests can import this file.
const formatLabel = (str) => str
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
  .split(' ')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const tabName = (tab) => tab?.tab ?? tab;

// Every page of the nav, in the nav's order, with its tabs: what the quick search lists, and where pins and
// link previews (og:image) take their icon. Data-free like constants.jsx, so any page can import it.
export const PAGE_INDEX = [
  ...Object.entries(PAGES.GENERAL).map(([page, { icon }]) => ({
    url: `/${toKebabCase(page)}`, label: formatLabel(page), section: 'General', group: 'pages', icon, tabs: [], nestedTabs: []
  })),
  ...Object.entries(PAGES.ACCOUNT).flatMap(([category, { icon: categoryIcon, style: categoryStyle, categories }]) => categories.map((sub) => ({
    url: `/account/${toKebabCase(category)}/${toKebabCase(sub.label)}`,
    label: formatLabel(sub.label),
    section: formatLabel(category),
    group: 'pages',
    icon: sub.icon || categoryIcon,
    // The icon's filter (the Premium gems' hue-rotate), for every reader that draws it as the nav does
    style: sub.style ?? categoryStyle,
    tabs: (sub.tabs ?? []).map((tab) => ({ tab: tabName(tab), icon: tab?.icon })),
    nestedTabs: sub.nestedTabs ?? []
  }))),
  ...Object.entries(PAGES.TOOLS).map(([tool, { icon }]) => ({
    url: `/tools/${toKebabCase(tool)}`, label: formatLabel(tool), section: 'Tools', group: 'tools', icon, tabs: [], nestedTabs: []
  }))
];

export const PAGE_BY_URL = Object.fromEntries(PAGE_INDEX.map((page) => [page.url, page]));

// The most specific icon for a page: nested tab, then tab, then page. null when nothing matches.
export const getPageIcon = ({ url, tab, nestedTab } = {}) => {
  const page = PAGE_BY_URL[url];
  if (!page) return null;
  const nested = page.nestedTabs.find((entry) => entry.tab === tab && entry.nestedTab === nestedTab)?.icon;
  return nested || page.tabs.find((entry) => entry.tab === tab)?.icon || page.icon || null;
};

// The icon at the start of a route's header row: its page's, else its section's (every wiki page takes the wiki's
// book, a guild's page the guilds' banner), else the two general pages PAGES has no entry for. Every titled header has
// one, so the title never jumps 48 px between pages.
const SECTION_ICONS = {
  wiki: PAGES.GENERAL.wiki.icon,
  guilds: PAGES.GENERAL.guilds.icon,
  statistics: 'etc/World_Category',
  'patch-notes': 'data/Coins5'
};
export const headerIconFor = (pathname) => {
  const page = PAGE_BY_URL[pathname];
  if (page?.icon) return { icon: page.icon, style: page.style };
  const icon = SECTION_ICONS[String(pathname ?? '').split('/')[1]];
  return icon ? { icon } : null;
};

// A route's nav icon for its link preview; null falls back to the site icon in _app.
export const pageIconFor = (pathname) => PAGE_BY_URL[pathname]?.icon ?? null;

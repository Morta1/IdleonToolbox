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
  ...Object.entries(PAGES.ACCOUNT).flatMap(([category, { icon: categoryIcon, categories }]) => categories.map((sub) => ({
    url: `/account/${toKebabCase(category)}/${toKebabCase(sub.label)}`,
    label: formatLabel(sub.label),
    section: formatLabel(category),
    group: 'pages',
    icon: sub.icon || categoryIcon,
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

// A route's nav icon for its link preview; null falls back to the site icon in _app.
export const pageIconFor = (pathname) => PAGE_BY_URL[pathname]?.icon ?? null;

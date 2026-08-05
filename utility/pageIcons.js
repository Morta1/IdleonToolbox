import { PAGES } from '@components/constants';

const toKebabCase = (str) => str
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/\s+/g, '-')
  .toLowerCase();

const nestedKey = (tab, nestedTab) => `${tab ?? ''}|${nestedTab ?? ''}`;

/**
 * Flattens PAGES into a url -> icon lookup, mirroring the urls that QuickSearch and
 * the pin logic build (`/dashboard`, `/account/misc/friends-stats`, `/tools/builds`).
 * Tabs and nested tabs keep their own icons when they define one.
 */
const buildIndex = () => {
  const index = {};

  Object.entries(PAGES.GENERAL).forEach(([page, { icon }]) => {
    index[`/${toKebabCase(page)}`] = { icon, tabs: {}, nestedTabs: {} };
  });

  Object.entries(PAGES.ACCOUNT).forEach(([category, { icon: categoryIcon, categories }]) => {
    categories.forEach((subCategory) => {
      const entry = { icon: subCategory.icon || categoryIcon, tabs: {}, nestedTabs: {} };
      subCategory.tabs?.forEach((tab) => {
        if (tab?.icon) entry.tabs[tab.tab] = tab.icon;
      });
      subCategory.nestedTabs?.forEach(({ tab, nestedTab, icon }) => {
        if (icon) entry.nestedTabs[nestedKey(tab, nestedTab)] = icon;
      });
      index[`/account/${toKebabCase(category)}/${toKebabCase(subCategory.label)}`] = entry;
    });
  });

  Object.entries(PAGES.TOOLS).forEach(([tool, { icon }]) => {
    index[`/tools/${toKebabCase(tool)}`] = { icon, tabs: {}, nestedTabs: {} };
  });

  return index;
};

const PAGE_ICONS = buildIndex();

/**
 * Resolves the icon for a page, preferring the most specific one available:
 * nested tab -> tab -> page. Returns null when nothing matches.
 */
export const getPageIcon = ({ url, tab, nestedTab } = {}) => {
  const entry = PAGE_ICONS[url];
  if (!entry) return null;
  return entry.nestedTabs[nestedKey(tab, nestedTab)] || entry.tabs[tab] || entry.icon || null;
};

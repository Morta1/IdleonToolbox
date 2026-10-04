import { PAGES } from '@components/constants';

// Route -> nav icon, so link previews (og:image) can show the page's own icon. URLs are built the
// same way QuickSearch builds them; a route with no entry falls back to the site icon in _app.
const toKebabCase = (str) => str
  .replace(/([a-z])([A-Z])/g, '$1-$2')
  .replace(/\s+/g, '-')
  .toLowerCase();

const buildIconMap = () => {
  const map = {};
  Object.entries(PAGES.GENERAL).forEach(([page, { icon }]) => {
    map[`/${toKebabCase(page)}`] = icon;
  });
  Object.entries(PAGES.ACCOUNT).forEach(([category, { icon: categoryIcon, categories }]) => {
    categories.forEach(({ label, icon }) => {
      map[`/account/${toKebabCase(category)}/${toKebabCase(label)}`] = icon || categoryIcon;
    });
  });
  Object.entries(PAGES.TOOLS).forEach(([tool, { icon }]) => {
    map[`/tools/${toKebabCase(tool)}`] = icon;
  });
  return map;
};

const PAGE_ICONS = buildIconMap();

export const pageIconFor = (pathname) => PAGE_ICONS[pathname] ?? null;

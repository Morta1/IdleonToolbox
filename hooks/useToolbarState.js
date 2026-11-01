import { useLocalStorage } from '@mantine/hooks';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// A list page's toolbar (Toolbar board), remembered in this browser under one key per page. Only the
// player's edits are stored, so a default that changes later reaches everyone who never touched it, and a
// key the page drops is ignored. Never in the URL: Search Console counted every query-param URL as a
// duplicate page (utility/nav-query.js). Mantine reads storage in an effect, so the export and the first
// client render show the defaults.
const useToolbarState = (page, defaults) => {
  // No defaultValue: a page nobody touched writes nothing.
  const [edits, setEdits, removeEdits] = useLocalStorage({ key: `toolbar:${page}` });
  const state = Object.fromEntries(Object.entries(defaults)
    .map(([key, value]) => [key, edits && Object.hasOwn(edits, key) ? edits[key] : value]));
  const set = (patch) => setEdits((current) => Object.fromEntries(Object.entries({ ...current, ...patch })
    .filter(([key, value]) => Object.hasOwn(defaults, key) && !same(value, defaults[key]))));
  return [state, set, removeEdits];
};

export default useToolbarState;

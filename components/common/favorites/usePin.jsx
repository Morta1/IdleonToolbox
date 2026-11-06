import { useRouter } from 'next/router';
import { useLocalStorage } from '@mantine/hooks';
import { PAGE_BY_URL } from '@utility/pageIndex';

const NO_PINS = [];

// A page that moved keeps its pins: the row reads the new page, and one already pinned there doesn't draw twice. One copy per
// stored pin, so a row keeps its identity between renders: Reorder matches rows by reference.
const MOVED_PAGES = {
  '/account/class-specific/royal-guardian': '/account/class-specific/royal-armory',
  '/tools/active-exp-calculator': '/tools/active-stuff-calculator'
};
const movedPins = new WeakMap();
const currentPin = (pin) => {
  const url = MOVED_PAGES[pin?.url];
  if (!url) return pin;
  if (!movedPins.has(pin)) movedPins.set(pin, { ...pin, url, name: url.split('/').at(-1) });
  return movedPins.get(pin);
};
const readPins = (stored) => {
  const seen = new Set();
  return stored.map(currentPin).filter((pin) => {
    const id = [pin?.name, pin?.tab, pin?.nestedTab, pin?.deeplyNestedTab].join('|');
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const usePin = () => {
  // No defaultValue, so a visitor with no pins stores nothing. Mantine reads storage in an effect: the export and the
  // first client render have no pins, and every reader of this hook moves together.
  const [stored, setPinnedPages] = useLocalStorage({ key: 'pinnedPages' });
  const pinnedPages = Array.isArray(stored) ? readPins(stored) : NO_PINS;
  const router = useRouter();
  // One rule for showing a page as pinned and for pinning or unpinning it: the same route and the same tabs, exactly.
  // A substring match lit the star on pages whose name contains a pinned one, and a pin with no tab on every tab.
  const pageName = router.pathname.split('/').at(-1);
  const { t, nt, dnt } = router.query;
  // A page opens on its first tab, so no tab and that tab are one view and one pin
  const firstTab = PAGE_BY_URL[router.pathname]?.tabs?.[0]?.tab ?? null;
  const tabKey = (value) => ((value ?? null) === firstTab ? null : (value ?? null));
  const isThisPin = ({ name, tab, nestedTab, deeplyNestedTab }) =>
    name === pageName &&
    tabKey(tab) === tabKey(t) &&
    (nestedTab ?? null) === (nt ?? null) &&
    (deeplyNestedTab ?? null) === (dnt ?? null);
  const isPinned = pinnedPages.find(isThisPin);

  const togglePin = () => {
    const exist = pinnedPages.find(isThisPin);
    let updatePinnedPages = [...pinnedPages];
    if (exist) {
      updatePinnedPages = updatePinnedPages.filter((pin) => !isThisPin(pin));
    } else {
      updatePinnedPages.push({ name: pageName, tab: t, nestedTab: nt, deeplyNestedTab: dnt, url: router.pathname })
    }
    setPinnedPages(updatePinnedPages);

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', exist ? 'page_unpinned' : 'page_pinned', {
        event_category: 'engagement',
        event_label: router.pathname,
        value: 1
      });
    }
  }

  const removePin = (index) => {
    const removed = pinnedPages[index];
    const updatePinnedPages = pinnedPages.filter((_, ind) => ind !== index);
    setPinnedPages(updatePinnedPages);
    if (removed && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_unpinned', {
        event_category: 'engagement',
        event_label: removed.url || removed.name,
        value: 1
      });
    }
  }

  return { pinnedPages, isPinned, togglePin, removePin, reorderPins: setPinnedPages, setPins: setPinnedPages };
};

export default usePin;

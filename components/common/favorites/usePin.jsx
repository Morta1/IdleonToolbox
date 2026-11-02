import { useRouter } from 'next/router';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { PAGE_BY_URL } from '@utility/pageIndex';

const usePin = () => {
  const { dispatch, state } = useContext(AppContext);
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
  const isPinned = state.pinnedPages?.find(isThisPin);

  const togglePin = () => {
    const exist = state?.pinnedPages?.find(isThisPin);
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    if (exist) {
      updatePinnedPages = updatePinnedPages.filter((pin) => !isThisPin(pin));
    } else {
      updatePinnedPages.push({ name: pageName, tab: t, nestedTab: nt, deeplyNestedTab: dnt, url: router.pathname })
    }
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });

    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', exist ? 'page_unpinned' : 'page_pinned', {
        event_category: 'engagement',
        event_label: router.pathname,
        value: 1
      });
    }
  }

  const removePin = (index) => {
    let updatePinnedPages = [...(state?.pinnedPages || [])];
    const removed = updatePinnedPages[index];
    updatePinnedPages = updatePinnedPages.filter((_, ind) => ind !== index);
    localStorage.setItem('pinnedPages', JSON.stringify(updatePinnedPages));
    dispatch({ type: 'pinnedPages', data: updatePinnedPages });
    if (removed && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_unpinned', {
        event_category: 'engagement',
        event_label: removed.url || removed.name,
        value: 1
      });
    }
  }

  const reorderPins = (newOrder) => {
    localStorage.setItem('pinnedPages', JSON.stringify(newOrder));
    dispatch({ type: 'pinnedPages', data: newOrder });
  }

  const setPins = (pages) => {
    localStorage.setItem('pinnedPages', JSON.stringify(pages));
    dispatch({ type: 'pinnedPages', data: pages });
  }

  return { pinnedPages: state.pinnedPages, isPinned, togglePin, removePin, reorderPins, setPins };
};

export default usePin;

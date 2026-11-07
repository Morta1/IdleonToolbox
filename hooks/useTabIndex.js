import { useState } from 'react';
import { useRouter } from 'next/router';

// The selected tab lives in the URL query, so it has to be derived from the router on every
// render. A component that keeps its own index only ever hears about clicks, so a deep link or a
// refresh leaves the strip highlighting the queried tab while the content stays on the first one.
// selectTab writes a choice back: a shallow push that keeps every other param (?demo, ?profile, the
// level above) and drops the levels below it (clearOnChange). Tabber and ViewSwitch both write here.
const useTabIndex = (tabs, { queryKey = 't', disableQuery = false, clearOnChange = [] } = {}) => {
  const router = useRouter();
  // Only used by tabs that deliberately stay out of the URL.
  const [localTab, setLocalTab] = useState(0);

  const query = router.query?.[queryKey];
  // A hand-typed or shared link may not match a tab's case
  const queryIndex = tabs?.findIndex((tab) => tab === query || `${tab}`.toLowerCase() === `${query ?? ''}`.toLowerCase()) ?? -1;
  const selectedTab = disableQuery ? localTab : (queryIndex >= 0 ? queryIndex : 0);

  const selectTab = (index) => {
    if (disableQuery) {
      setLocalTab(index);
      return;
    }
    const query = { ...router.query, [queryKey]: tabs[index] };
    clearOnChange.forEach((key) => delete query[key]);
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  return [selectedTab, selectTab];
};

export default useTabIndex;

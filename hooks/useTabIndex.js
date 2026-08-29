import { useState } from 'react';
import { useRouter } from 'next/router';

// The selected tab lives in the URL query, so it has to be derived from the router on every
// render. A component that keeps its own index only ever hears about clicks, so a deep link or a
// refresh leaves the strip highlighting the queried tab while the content stays on the first one.
const useTabIndex = (tabs, { queryKey = 't', disableQuery = false } = {}) => {
  const router = useRouter();
  // Only used by tabs that deliberately stay out of the URL.
  const [localTab, setLocalTab] = useState(0);

  const queryIndex = tabs?.findIndex((tab) => tab === router.query?.[queryKey]) ?? -1;
  const selectedTab = disableQuery ? localTab : (queryIndex >= 0 ? queryIndex : 0);

  return [selectedTab, setLocalTab];
};

export default useTabIndex;

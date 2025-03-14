import React, { useEffect, useState } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import { useRouter } from 'next/router';

const Tabber = ({
                  tabs,
                  components,
                  icons,
                  children,
                  onTabChange,
                  forceScroll,
                  orientation = 'horizontal',
                  iconsOnly,
                  queryKey = 't',
                  clearOnChange = [],
                  disableQuery = false
                }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const router = useRouter();

  // State for managing active tab if `disableQuery` is enabled
  const [activeTab, setActiveTab] = useState(0);

  const queryValue = router.query[queryKey];
  const activeTabIndex = tabs.findIndex((tab) => tab === queryValue);
  const selectedTab = disableQuery ? activeTab : (activeTabIndex >= 0 ? activeTabIndex : 0);

  useEffect(() => {
    if (!disableQuery) {
      // Set the default query parameter if missing
      if (!queryValue) {
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, [queryKey]: tabs[selectedTab] }
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [queryValue, queryKey, tabs, selectedTab, router, disableQuery]);

  const handleOnClick = (e, selected) => {
    if (disableQuery) {
      setActiveTab(selected);
    } else {
      const newQuery = { ...router.query, [queryKey]: tabs[selected] };
      // Remove specified query parameters
      clearOnChange.forEach((key) => delete newQuery[key]);
      router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    }

    onTabChange && onTabChange(selected);
  };

  const array = Array.isArray(children) ? children : [children];
  return <Box sx={orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}}>
    <Tabs
      centered={!forceScroll && (!isMd || (isMd && tabs.length < 4))}
      scrollButtons
      allowScrollButtonsMobile
      sx={{ marginBottom: 3 }}
      variant={(isMd && tabs.length >= 4) || forceScroll ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {(components ?? tabs)?.map((tab, index) => {
        return <Tab
          iconPosition="start"
          icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`}/> : null}
          wrapped label={iconsOnly ? '' : tab}
          sx={{ minWidth: 62 }}
          key={`${tab?.[index]}-${index}`}/>;
      })}
    </Tabs>
    {onTabChange ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </Box>
};

export default Tabber;
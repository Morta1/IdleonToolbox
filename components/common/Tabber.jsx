import React, { useEffect } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import { useRouter } from 'next/router';

const Tabber = ({
                  tabs,
                  icons,
                  children,
                  onTabChange,
                  forceScroll,
                  orientation = 'horizontal',
                  iconsOnly,
                  queryKey = 't',
                  clearOnChange = []
                }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const router = useRouter();
  const queryValue = router.query[queryKey];
  const activeTabIndex = tabs.findIndex((tab) => tab === queryValue);
  const selectedTab = activeTabIndex >= 0 ? activeTabIndex : 0;

  useEffect(() => {
    // Set the default query parameter if missing
    if (!queryValue) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, [queryKey]: tabs[selectedTab] },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [queryValue, queryKey, tabs, selectedTab, router]);

  const handleOnClick = (e, selected) => {
    const newQuery = { ...router.query, [queryKey]: tabs[selected] };
    // Remove specified query parameters
    clearOnChange.forEach((key) => delete newQuery[key]);
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    onTabChange && onTabChange(selected);
  }

  const array = Array.isArray(children) ? children : [children];
  return <Box sx={orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}}>
    <Tabs
      centered={!isMd || (isMd && tabs.length < 4)}
      scrollButtons
      allowScrollButtonsMobile
      sx={{ marginBottom: 3 }}
      variant={(isMd && tabs.length >= 4) || forceScroll ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {tabs?.map((tab, index) => {
        return <Tab iconPosition="start" icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`}/> : null}
                    wrapped label={iconsOnly ? '' : tab} sx={{ minWidth: 62 }} key={`${tab}-${index}`}/>;
      })}
    </Tabs>
    {onTabChange ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </Box>
};

export default Tabber;

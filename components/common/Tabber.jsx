import React from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import { useRouter } from 'next/router';
import useTabIndex from '@hooks/useTabIndex';

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
                  disableQuery = false,
                  keepChildren,
                  activeTab
                }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'), { noSsr: true });
  const router = useRouter();

  // Pages that render their own content off the tab index read the same hook, so the strip and
  // the page can't disagree on a deep link.
  const [ownTab, setActiveTab] = useTabIndex(tabs, { queryKey, disableQuery });
  // A parent that needs to select a tab itself (the dashboard alerts modal deep-links into one)
  // passes activeTab and owns the index from then on, via onTabChange.
  const selectedTab = activeTab ?? ownTab;

  // No default query is stamped on mount. A shallow router.replace here re-rendered the
  // app shell mid-hydration, which let DefaultSeo re-emit its head after the page's NextSeo
  // and overwrite the page title and description. selectedTab already falls back to 0 when
  // the query is absent, so the URL only gains ?t= once a tab is actually clicked.

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
  // A parent that renders its own tab content passes one child for every tab, so it must not be
  // filtered down to the selected index here.
  const showAllChildren = keepChildren ?? Boolean(onTabChange);
  const useScrollable = forceScroll || (isMd && tabs.length >= 4) || tabs.length >= 8;
  return <Box sx={orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}}>
    <Tabs
      centered={!useScrollable}
      scrollButtons
      allowScrollButtonsMobile
      sx={{
        marginBottom: 3,
        // MUI drops `centered` for scrollable tabs. `safe center` keeps them centred while they
        // fit and falls back to flex-start the moment they overflow, so the leading tabs never
        // get clipped past the left edge where nothing can scroll them back into view.
        ...(useScrollable ? { '& .MuiTabs-flexContainer': { justifyContent: 'safe center' } } : {})
      }}
      variant={useScrollable ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {(components ?? tabs)?.map((tab, index) => {
        return <Tab
          iconPosition="start"
          icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`} alt=""/> : null}
          wrapped label={iconsOnly ? '' : tab}
          sx={{ minWidth: 62 }}
          key={`${tab?.[index]}-${index}`}/>;
      })}
    </Tabs>
    {showAllChildren ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </Box>
};

export default Tabber;
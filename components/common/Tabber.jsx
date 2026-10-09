import React, { useEffect, useRef } from 'react';
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
                  activeTab,
                  // Opt-ins for a left-aligned, full-width strip: align="start" drops the centring, endSlot
                  // renders at the right end of the same row. Left out, the strip is unchanged.
                  align,
                  endSlot,
                  // Also opt-in: the row strip sticks at this offset from the top of the viewport.
                  stickyTop,
                  // Also opt-in: ids that tie each tab to one tabpanel wrapping the children.
                  idPrefix
                }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'));
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
  const alignStart = align === 'start';
  const rowStrip = alignStart || endSlot != null;
  // A row strip shares its width with the end slot, so it scrolls whenever its tabs outgrow it.
  const useScrollable = forceScroll || rowStrip || (isMd && tabs.length >= 4) || tabs.length >= 8;
  const panelId = idPrefix ? `${idPrefix}-panel` : undefined;
  const tabsRef = useRef(null);

  // MUI scrolls the selected tab into view when it changes, but not when the strip itself settles
  // later (a deep link renders before the end slot and fonts land), which left it off-screen.
  useEffect(() => {
    if (!rowStrip) return;
    const reveal = () => {
      const scroller = tabsRef.current?.querySelector('.MuiTabs-scroller');
      const tab = scroller?.querySelector('[role="tab"][aria-selected="true"]');
      if (!tab) return;
      const left = tab.offsetLeft - scroller.scrollLeft;
      if (left < 0 || left + tab.offsetWidth > scroller.clientWidth) {
        scroller.scrollLeft = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
      }
    };
    const frame = requestAnimationFrame(reveal);
    const late = setTimeout(reveal, 500);
    // Tab counts land with the data and widen the tabs after both checks have run, and the scroll
    // arrows that then appear narrow the scroller: either resize checks again. The check waits a
    // moment so it lands after MUI's own scroll-into-view, which runs on the same change and stops
    // a few pixels short.
    let settle = null;
    const revealSoon = () => {
      clearTimeout(settle);
      settle = setTimeout(reveal, 150);
    };
    const scroller = tabsRef.current?.querySelector('.MuiTabs-scroller');
    const list = tabsRef.current?.querySelector('.MuiTabs-flexContainer');
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(revealSoon) : null;
    [scroller, list].forEach((element) => element && observer?.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(late);
      clearTimeout(settle);
      observer?.disconnect();
    };
  }, [selectedTab, rowStrip]);
  const tabStrip = (
    <Tabs
      ref={tabsRef}
      centered={!useScrollable && !alignStart}
      // A row strip only grows arrows once its tabs overflow; true would reserve their width at all times.
      scrollButtons={rowStrip ? 'auto' : true}
      allowScrollButtonsMobile
      sx={{
        marginBottom: rowStrip ? 0 : 3,
        ...(rowStrip ? { flex: '1 1 auto', minWidth: 0 } : {}),
        ...(alignStart ? { minHeight: 44 } : {}),
        // MUI drops `centered` for scrollable tabs. `safe center` keeps them centred while they
        // fit and falls back to flex-start the moment they overflow, so the leading tabs never
        // get clipped past the left edge where nothing can scroll them back into view.
        ...(alignStart
          ? { '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' } }
          : useScrollable ? { '& .MuiTabs-flexContainer': { justifyContent: 'safe center' } } : {})
      }}
      variant={useScrollable ? 'scrollable' : 'standard'}
      value={selectedTab} onChange={handleOnClick}>
      {(components ?? tabs)?.map((tab, index) => {
        return <Tab
          iconPosition="start"
          icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`} alt=""/> : null}
          wrapped label={iconsOnly ? '' : tab}
          sx={alignStart ? { minWidth: 62, minHeight: 44, px: 1.75 } : { minWidth: 62 }}
          {...(idPrefix ? { id: `${idPrefix}-tab-${index}`, 'aria-controls': panelId } : {})}
          key={`${tabs[index]}-${index}`}/>;
      })}
    </Tabs>
  );
  return <Box sx={orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}}>
    {rowStrip ? (
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2, mb: 3, ...(alignStart ? { borderBottom: '1px solid #2f3641' } : {}),
        ...(stickyTop != null ? {
          position: 'sticky', top: stickyTop, zIndex: (theme) => theme.zIndex.appBar - 2, bgcolor: 'background.default',
          // A landscape phone has no height to spare for pinned bars.
          '@media (max-height: 500px)': { position: 'static' }
        } : {})
      }}>
        {tabStrip}
        {endSlot != null ? <Box sx={{ flexShrink: 0 }}>{endSlot}</Box> : null}
      </Box>
    ) : tabStrip}
    {idPrefix ? (
      <div role="tabpanel" id={panelId} aria-labelledby={`${idPrefix}-tab-${selectedTab}`}>
        {showAllChildren ? children : array?.map((child, index) => (index === selectedTab ? child : null))}
      </div>
    ) : showAllChildren ? children : array?.map((child, index) => {
      return index === selectedTab ? child : null;
    })}
  </Box>
};

export default Tabber;
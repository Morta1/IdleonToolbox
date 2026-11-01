import React, { useEffect, useRef, useState } from 'react';
import { Tab, Tabs, useMediaQuery } from '@mui/material';
import { prefix } from '@utility/helpers';
import Box from '@mui/material/Box';
import useTabIndex from '@hooks/useTabIndex';
import useProfileBannerState from '@hooks/useProfileBannerState';
import { navBarHeight, profileBannerHeight } from '@components/constants';
import { PICKER_AFTER, SectionPicker, SectionPills, SPRITE_BOX } from '@components/common/SectionTabs';

// The phone strip has no arrows: a fade shows that more tabs wait on that side.
const FADE = {
  left: 'linear-gradient(to right, transparent, black 24px)',
  right: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
  both: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)'
};

// The pinned strip's height (48 px tabs and the 1 px divider). A sticky table header in the tab adds it to its
// own top (DataTable, 3g), so it sticks under the strip instead of behind it.
const PINNED_STRIP_HEIGHT = 49;

const Tabber = ({
                  tabs,
                  components,
                  icons,
                  children,
                  onTabChange,
                  forceScroll,
                  orientation = 'horizontal',
                  iconsOnly,
                  // 1: the page's own tabs (?t=), a strip under the title. 2: a part of a tab (?nt=), pills.
                  level = 1,
                  queryKey = level === 2 ? 'nt' : 't',
                  // What a reader sees and hears, where it differs from the URL value in tabs.
                  labels,
                  // The tablist's name.
                  label,
                  clearOnChange = [],
                  disableQuery = false,
                  keepChildren,
                  activeTab,
                  // Page tabs start under the page title, in a full-width strip. align="center" is the
                  // opt-out. endSlot renders at the right end of the same row.
                  align = 'start',
                  endSlot,
                  // Also opt-in: the row strip sticks at this offset from the top of the viewport.
                  stickyTop,
                  // Also opt-in: ids that tie each tab to one tabpanel wrapping the children.
                  idPrefix
                }) => {
  const isMd = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const { isVisible: showProfileBanner } = useProfileBannerState();
  // Phones get no scroll arrows (MUI hides them below sm); the strip fades at whichever edge has more
  // tabs waiting past it.
  const [moreToTheLeft, setMoreToTheLeft] = useState(false);
  const [moreToTheRight, setMoreToTheRight] = useState(false);
  const fade = moreToTheLeft && moreToTheRight ? FADE.both : moreToTheLeft ? FADE.left : moreToTheRight ? FADE.right : null;

  // Pages that render their own content off the tab index read the same hook, so the strip and
  // the page can't disagree on a deep link.
  const [ownTab, selectTab] = useTabIndex(tabs, { queryKey, disableQuery, clearOnChange });
  // A parent that needs to select a tab itself (the dashboard alerts modal deep-links into one)
  // passes activeTab and owns the index from then on, via onTabChange.
  const selectedTab = activeTab ?? ownTab;
  const names = tabs?.map((tab, index) => labels?.[index] ?? tab) ?? [];

  // No default query is stamped on mount. A shallow router.replace here re-rendered the
  // app shell mid-hydration, which let DefaultSeo re-emit its head after the page's NextSeo
  // and overwrite the page title and description. selectedTab already falls back to 0 when
  // the query is absent, so the URL only gains ?t= once a tab is actually clicked.

  const choose = (index) => {
    selectTab(index);
    onTabChange?.(index);
  };

  const array = Array.isArray(children) ? children : [children];
  // A parent that renders its own tab content passes one child for every tab, so it must not be
  // filtered down to the selected index here.
  const showAllChildren = keepChildren ?? Boolean(onTabChange);
  const alignStart = align === 'start';
  // Level 2 draws its own pills, so the row, its reveal and its fade are level 1's alone.
  const rowStrip = level === 1 && (alignStart || endSlot != null);
  // A row strip shares its width with the end slot, so it scrolls whenever its tabs outgrow it.
  const useScrollable = forceScroll || rowStrip || (isMd && tabs.length >= 4) || tabs.length >= 8;
  const panelId = idPrefix ? `${idPrefix}-panel` : undefined;
  const tabsRef = useRef(null);
  // A page's tab strip pins under the nav bar (and the profile banner when it shows) on a phone, so another
  // tab is one tap away from anywhere on a long page (Tabs board step 5). A page that pins it itself
  // (stickyTop, the leaderboards under their control bar) keeps its own top at every width.
  const pinOnPhone = rowStrip && stickyTop == null && orientation !== 'vertical';
  const phoneTop = navBarHeight + (showProfileBanner ? profileBannerHeight : 0);

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
    const updateFade = () => {
      const scroller = tabsRef.current?.querySelector('.MuiTabs-scroller');
      if (!scroller) return;
      setMoreToTheLeft(scroller.scrollLeft > 1);
      setMoreToTheRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1);
    };
    const frame = requestAnimationFrame(() => {
      reveal();
      updateFade();
    });
    const late = setTimeout(reveal, 500);
    // Tab counts land with the data and widen the tabs after both checks have run, and the scroll
    // arrows that then appear narrow the scroller: either resize checks again. The check waits a
    // moment so it lands after MUI's own scroll-into-view, which runs on the same change and stops
    // a few pixels short.
    let settle = null;
    const revealSoon = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        reveal();
        updateFade();
      }, 150);
    };
    const scroller = tabsRef.current?.querySelector('.MuiTabs-scroller');
    const list = tabsRef.current?.querySelector('.MuiTabs-flexContainer');
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(revealSoon) : null;
    [scroller, list].forEach((element) => element && observer?.observe(element));
    scroller?.addEventListener('scroll', updateFade, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(late);
      clearTimeout(settle);
      observer?.disconnect();
      scroller?.removeEventListener('scroll', updateFade);
    };
  }, [selectedTab, rowStrip]);
  const tabStrip = (
    <Tabs
      ref={tabsRef}
      centered={!useScrollable && !alignStart}
      // A row strip only grows arrows once its tabs overflow; true would reserve their width at all times.
      scrollButtons={rowStrip ? 'auto' : true}
      sx={{
        marginBottom: rowStrip ? 0 : 3,
        ...(rowStrip ? { flex: '1 1 auto', minWidth: 0 } : {}),
        ...(alignStart ? { minHeight: 48 } : {}),
        ...(fade ? {
          [`@media (max-width: 599.95px)`]: {
            '& .MuiTabs-scroller': { maskImage: fade }
          }
        } : {}),
        // MUI drops `centered` for scrollable tabs. `safe center` keeps them centred while they
        // fit and falls back to flex-start the moment they overflow, so the leading tabs never
        // get clipped past the left edge where nothing can scroll them back into view.
        ...(alignStart
          ? { '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' } }
          : useScrollable ? { '& .MuiTabs-flexContainer': { justifyContent: 'safe center' } } : {})
      }}
      variant={useScrollable ? 'scrollable' : 'standard'}
      aria-label={label}
      value={selectedTab} onChange={(event, index) => choose(index)}>
      {(components ?? names)?.map((tab, index) => {
        return <Tab
          iconPosition="start"
          // A named tab's sprite sits in a 24 px square from the start; a sprite-only tab (the caverns' banners) sizes
          // to its sprite but never collapses below that square while it loads.
          icon={icons?.[index] ? <img src={`${prefix}${icons?.[index]}.png`} alt=""
                                      style={iconsOnly ? { height: 24, width: 'auto', minWidth: 24, objectFit: 'contain' } : SPRITE_BOX}/> : null}
          wrapped label={iconsOnly ? '' : tab}
          // A sprite-only tab still carries its name for screen readers.
          {...(iconsOnly ? { 'aria-label': names[index] } : {})}
          sx={alignStart ? {
            minWidth: 62, minHeight: 48, px: 1.75,
            // Tabs board, on a phone: names only. The sprite beside each name fit two or three of the Hole's five
            // tabs on a 384 px screen. A sprite-only tab keeps its sprite: it has nothing else to show.
            ...(iconsOnly ? {} : { '& .MuiTab-icon': { display: { xs: 'none', sm: 'inline-block' } } })
          } : { minWidth: 62 }}
          {...(idPrefix ? { id: `${idPrefix}-tab-${index}`, 'aria-controls': panelId } : {})}
          key={`${tabs[index]}-${index}`}/>;
      })}
    </Tabs>
  );
  const strip = level === 2
    ? (names.length > PICKER_AFTER
      ? <SectionPicker tabs={tabs} names={names} icons={icons} selectedTab={selectedTab} onSelect={choose} label={label}/>
      : <SectionPills tabs={tabs} names={names} icons={icons} iconsOnly={iconsOnly} components={components}
                      selectedTab={selectedTab} onSelect={choose} label={label}/>)
    : rowStrip ? (
      <Box sx={(theme) => ({
        display: 'flex', alignItems: 'center', gap: 2, mb: 3, ...(alignStart ? { borderBottom: 1, borderColor: 'divider' } : {}),
        ...(stickyTop != null ? { position: 'sticky', top: stickyTop, zIndex: theme.zIndex.appBar - 2, bgcolor: 'background.default' } : {}),
        ...(pinOnPhone ? {
          [theme.breakpoints.down('sm')]: { position: 'sticky', top: phoneTop, zIndex: theme.zIndex.appBar - 2, bgcolor: 'background.default' }
        } : {}),
        // A landscape phone has no height to spare for pinned bars. Last, so it wins over the phone pin.
        '@media (max-height: 500px)': { position: 'static' }
      })}>
        {tabStrip}
        {endSlot != null ? <Box sx={{ flexShrink: 0 }}>{endSlot}</Box> : null}
      </Box>
    ) : tabStrip;
  return <Box sx={(theme) => ({
    ...(orientation === 'vertical' ? { flexGrow: 1, display: 'flex' } : {}),
    ...(pinOnPhone ? {
      [theme.breakpoints.down('sm')]: { '--page-tabs-pinned': `${PINNED_STRIP_HEIGHT}px` },
      '@media (max-height: 500px)': { '--page-tabs-pinned': '0px' }
    } : {})
  })}>
    {strip}
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
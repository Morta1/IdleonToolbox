import { useEffect, useEffectEvent, useRef, useState } from 'react';
import Router from 'next/router';
import { Box, Button, Stack, Typography, Unstable_TrapFocus as FocusTrap } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconMoon, IconSun } from '@tabler/icons-react';
import usePageTop from '@hooks/usePageTop';
import { trackEvent } from '@utility/analytics';
import { sessionQuery } from '@utility/nav-query';
import { setTourMenu } from '@utility/whatsNew';

const DASHBOARD = '/dashboard';
const CARD_WIDTH = 300;
const GAP = 12;
const EDGE = 8;
// The page's ready when its loader goes, which the route's chunk can hold back on a slow connection.
const PAGE_WAIT_MS = 15000;
// A section that's on is drawn with the page, or just after it: one that hasn't come by now is switched off.
const TARGET_WAIT_MS = 1500;
const POLL_MS = 100;

const SIDE_FIRST = ['right', 'below', 'left', 'above'];
const STOPS = [
  {
    step: 'worlds_account', title: 'Worlds and Account',
    text: 'World 1 to 7 are under Worlds, and the rest of the old side menu is under Account.',
    targets: ['[data-tour="nav-worlds"]', '[data-tour="nav-account"]'], pad: 4, inBar: true, place: ['below']
  },
  {
    step: 'goals', title: 'Goals',
    text: 'Track what you\'re working toward here. Add a goal from any page with a target icon.',
    targets: ['[data-tour="goals"]'], pad: 6, place: SIDE_FIRST
  },
  {
    step: 'timers', title: 'Dashboard timers',
    text: 'What\'s ready comes first, then everything else, soonest at the top.',
    targets: ['[data-tour="timers"]'], pad: 6, place: SIDE_FIRST
  }
];
const THEME_STOP = {
  step: 'theme', title: 'Theme', text: 'Pick dark, light or your system\'s setting here, or from Settings.', pad: 6, theme: true
};
// A player with a user menu picks there. Anyone else has the footer's link, at the page's end.
const USER_THEME = { ...THEME_STOP, menu: 'user', inBar: true, targets: ['[data-tour="user-menu"]', '[data-tour="theme-menu"]'], place: ['left', 'below'] };
const FOOTER_THEME = { ...THEME_STOP, menu: 'footer', atEnd: true, targets: ['[data-tour="theme-link"]', '[data-tour="theme-menu"]'], place: ['left', 'right', 'above'] };

const isShown = (element) => {
  const { width, height } = element.getBoundingClientRect();
  return width > 0 && height > 0 && getComputedStyle(element).visibility === 'visible';
};
const shownElements = (targets) => targets.flatMap((selector) => [...document.querySelectorAll(selector)]).filter(isShown);
const allHere = (stop) => stop.theme || stop.targets.every((selector) => shownElements([selector]).length);

const boxOf = (targets) => {
  const boxes = shownElements(targets).map((element) => element.getBoundingClientRect());
  if (!boxes.length) return null;
  return {
    top: Math.min(...boxes.map((box) => box.top)), left: Math.min(...boxes.map((box) => box.left)),
    bottom: Math.max(...boxes.map((box) => box.bottom)), right: Math.max(...boxes.map((box) => box.right))
  };
};

const until = async (ready, ms) => {
  const deadline = performance.now() + ms;
  while (!ready() && performance.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, POLL_MS);
    });
  }
  return ready();
};

// Where the page's own pinned things end: the bar and the band (usePageTop), then the section pills' sticky bar.
const pinnedBottom = (pageTop) => {
  let bar = document.querySelector('[data-tour="pills"]');
  while (bar && getComputedStyle(bar).position !== 'sticky') bar = bar.parentElement;
  return bar ? parseFloat(getComputedStyle(bar).top) + bar.offsetHeight : pageTop;
};

const smoothly = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

// The window's edge stops the cut, and on the page the pinned bars do: the dim covers them. A target that fits stays where
// it is; one that doesn't parks its top under the pinned bars, which a plain scrollIntoView would put it behind.
const bringIntoView = (stop, pageTop) => {
  if (stop.atEnd) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: smoothly() });
    return;
  }
  const box = !stop.inBar && boxOf(stop.targets);
  if (!box) return;
  const park = pinnedBottom(pageTop) + GAP + stop.pad;
  if (box.top < park || box.bottom > window.innerHeight - EDGE) {
    window.scrollTo({ top: box.top + window.scrollY - park, behavior: smoothly() });
  }
};

const cutFor = (stop, pageTop) => {
  const box = boxOf(stop.targets);
  if (!box) return null;
  const roof = stop.inBar || stop.atEnd ? 0 : pinnedBottom(pageTop);
  const top = Math.round(Math.max(box.top - stop.pad, roof));
  const bottom = Math.round(Math.min(box.bottom + stop.pad, window.innerHeight - GAP));
  return { top, left: Math.round(box.left - stop.pad), width: Math.round(box.right - box.left + stop.pad * 2), height: Math.max(0, bottom - top) };
};

// The first side in order that holds the whole card inside the window; failing all, its bottom right corner, over a panel
// with no room beside it.
const placeCard = (cut, size, order) => {
  const width = document.documentElement.clientWidth;
  const height = window.innerHeight;
  const maxLeft = width - size.width - EDGE;
  const maxTop = height - size.height - EDGE;
  const across = Math.max(EDGE, Math.min(cut.left, maxLeft));
  const down = Math.max(EDGE, Math.min(cut.top, maxTop));
  const spots = {
    below: { left: across, top: cut.top + cut.height + GAP },
    above: { left: across, top: cut.top - size.height - GAP },
    right: { left: cut.left + cut.width + GAP, top: down },
    left: { left: cut.left - size.width - GAP, top: down }
  };
  const fits = ({ left, top }) => left >= EDGE && top >= EDGE && left <= maxLeft && top <= maxTop;
  return order.map((side) => spots[side]).find(fits) ?? { left: Math.max(EDGE, maxLeft), top: Math.max(EDGE, maxTop) };
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ThemeButton = () => {
  const { colorScheme, setMode } = useColorScheme();
  const light = colorScheme === 'light';
  return <Button variant="outlined" sx={{ alignSelf: 'flex-start', mb: 1 }} startIcon={light ? <IconMoon size={18}/> : <IconSun size={18}/>}
                 onClick={() => setMode(light ? 'dark' : 'light')}>
    {light ? 'Dark' : 'Try light'}
  </Button>;
};

// Behind Show me around, from 1200 wide, where the nav is in the bar. All its stops are on the Dashboard: it goes there once,
// works out which stops there are, so "of N" never changes partway, and goes back to where it started when it ends. A route
// change it didn't start ends it, the browser's Back included, and a reload ends it with the page.
const Tour = ({ onEnd }) => {
  const [stops, setStops] = useState(null);
  const [index, setIndex] = useState(0);
  const [cut, setCut] = useState(null);
  const [cardAt, setCardAt] = useState(null);
  const cardRef = useRef(null);
  // A route change of its own, under way.
  const ownRoute = useRef(false);
  const pushed = useRef(false);
  const startScroll = useRef(0);
  const seen = useRef(new Set());
  const pageTop = usePageTop();
  const stop = stops?.[index] ?? null;

  const leave = () => {
    if (pushed.current) {
      ownRoute.current = true;
      Router.back();
    } else {
      window.scrollTo({ top: startScroll.current, behavior: 'auto' });
    }
    onEnd();
  };

  const end = useEffectEvent(() => onEnd());
  const leaveNow = useEffectEvent(() => leave());
  // Once for each stop: a band arriving later moves pageTop, and the frame loop below follows it without a scroll.
  const arriveAt = useEffectEvent((next) => {
    setTourMenu(next.menu ?? null);
    bringIntoView(next, pageTop);
    if (!seen.current.has(next.step)) {
      seen.current.add(next.step);
      trackEvent('whats_new_tour_stop', { step: next.step });
    }
  });

  useEffect(() => {
    let gone = false;
    startScroll.current = window.scrollY;
    const begin = async () => {
      if (Router.pathname !== DASHBOARD) {
        ownRoute.current = true;
        pushed.current = true;
        await Router.push({ pathname: DASHBOARD, query: sessionQuery(Router.query) });
        ownRoute.current = false;
      }
      const loaded = await until(() => !document.querySelector('[data-testid="page-loader"]'), PAGE_WAIT_MS);
      if (gone) return;
      if (!loaded) {
        end();
        return;
      }
      const themeStop = shownElements(USER_THEME.targets.slice(0, 1)).length ? USER_THEME : FOOTER_THEME;
      const all = [...STOPS, themeStop];
      await until(() => all.every(allHere), TARGET_WAIT_MS);
      if (!gone) setStops(all.filter(allHere));
    };
    begin().catch(() => end());
    return () => {
      gone = true;
    };
  }, []);

  // A route change it didn't start, the browser's Back included: by then the address already reads where it's going, so the
  // target is what tells. A query-only change on the Dashboard isn't one.
  useEffect(() => {
    const onRoute = (url) => {
      if (ownRoute.current || new URL(url, window.location.href).pathname === DASHBOARD) return;
      end();
    };
    Router.events.on('routeChangeStart', onRoute);
    return () => Router.events.off('routeChangeStart', onRoute);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      // Ctrl + K's search is a modal that would open under the dim, and take the focus from the card.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        event.stopPropagation();
      }
      if (event.key !== 'Escape') return;
      event.preventDefault();
      leaveNow();
    };
    // The nav it points at goes behind the burger below 1200.
    const wide = window.matchMedia('(min-width: 1200px)');
    const onWidth = () => {
      if (!wide.matches) leaveNow();
    };
    document.addEventListener('keydown', onKey, true);
    wide.addEventListener('change', onWidth);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      wide.removeEventListener('change', onWidth);
    };
  }, []);

  useEffect(() => () => setTourMenu(null), []);

  useEffect(() => {
    if (stop) arriveAt(stop);
  }, [stop]);

  // Every frame, so the cut stays on its target through a smooth scroll, a late ad or a player's wheel.
  useEffect(() => {
    if (!stop) return undefined;
    let frame = null;
    const follow = () => {
      const nextCut = cutFor(stop, pageTop);
      setCut((current) => (same(current, nextCut) ? current : nextCut));
      const size = cardRef.current?.getBoundingClientRect();
      if (nextCut && size) {
        const nextAt = placeCard(nextCut, size, stop.place);
        setCardAt((current) => (same(current, nextAt) ? current : nextAt));
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [stop, pageTop]);

  const last = stops ? index === stops.length - 1 : false;
  const finish = () => {
    trackEvent('whats_new_tour_finish');
    leave();
  };

  // The theme stop's menu (modal + 1, TourMenu) stands above the dim, so its rows work, and below the card.
  return <>
    {/* Takes every click on the page. The cut is a hole in a shadow, so the page shows through it untouched. */}
    <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: (theme) => theme.zIndex.modal }}/>
    {cut ? <Box aria-hidden style={cut} sx={{
      position: 'fixed', zIndex: (theme) => theme.zIndex.modal, borderRadius: '8px', pointerEvents: 'none',
      boxShadow: (theme) => `0 0 0 200vmax ${(theme.vars || theme).palette.backdrop}`,
      outline: 2, outlineStyle: 'solid', outlineColor: 'primary.main'
    }}/> : <Box aria-hidden sx={{
      position: 'fixed', inset: 0, zIndex: (theme) => theme.zIndex.modal, pointerEvents: 'none',
      bgcolor: (theme) => (theme.vars || theme).palette.backdrop
    }}/>}
    {stop ? <FocusTrap open disableAutoFocus disableRestoreFocus>
      <Box ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="tour-title" tabIndex={-1} style={cardAt ?? undefined} sx={{
        // Unseen until it's measured, but focusable: Next takes the focus as it mounts.
        position: 'fixed', top: 0, left: 0, opacity: cardAt ? 1 : 0, zIndex: (theme) => theme.zIndex.modal + 2,
        width: CARD_WIDTH, p: 2, outline: 'none', bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '8px',
        boxShadow: (theme) => (theme.vars || theme).palette.shadow.floating
      }}>
        <Stack key={stop.step}>
          <Typography id="tour-title" variant="value" component="h2" sx={{ mb: 0.5, fontWeight: 600 }}>{stop.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{stop.text}</Typography>
          {stop.theme ? <ThemeButton/> : null}
          <Stack direction="row" alignItems="center" gap={0.5} sx={{ mr: -0.5, mb: -0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>{`${index + 1} of ${stops.length}`}</Typography>
            {last ? null : <Button onClick={leave}>Skip</Button>}
            {index > 0 ? <Button onClick={() => setIndex(index - 1)}>Back</Button> : null}
            <Button variant="contained" autoFocus onClick={last ? finish : () => setIndex(index + 1)}>{last ? 'Done' : 'Next'}</Button>
          </Stack>
        </Stack>
      </Box>
    </FocusTrap> : null}
  </>;
};

export default Tour;

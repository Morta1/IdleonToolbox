import { useContext, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Fade, Modal, useMediaQuery } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import { IconChevronDown, IconSettings } from '@tabler/icons-react';
import { items } from '@website-data';
import { AppContext } from '@components/common/context/AppProvider';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { timersInBrief, useTimerRows } from '@components/dashboard/Etc';
import { baseTrackers } from '@utility/dashboard/baseTrackers';
import { loadTrackers } from '@utility/dashboard/trackerStore';
import { trackEvent } from '@utility/analytics';
import { formatDuration, formatNum, prefix } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { PAGE_INDEX } from '@utility/pageIndex';
import { loadoutFromCharacter } from '@utility/wardrobeQuery';
import useNow from '@hooks/useNow';
import StoryDoll, { IDLE, prepareCrew, WALK } from './StoryDoll';
import { CROWD_PACE, helloSpots, lastSpots, sampleCrew, stageUnit, walkerPace, WALKER_CROSSING_MS, walkIn } from './storyCrew';
import css from './story.module.css';

const SLIDES = [
  { step: 'hello', look: css.w1, ms: 5200 },
  { step: 'menus', look: css.w2, ms: 4400 },
  { step: 'timers', look: css.w3, ms: 5400 },
  { step: 'page_settings', look: css.w4, ms: 4800 },
  { step: 'pages', look: css.w5, ms: 4600 },
  { step: 'lights', look: css.ink }
];
const LAST = SLIDES.length - 1;
const WORLD_ICONS = ['data/BadgeG2', 'data/BadgeD2', 'data/BadgeI2', 'data/Ladle', 'data/GemP24', 'etc/sneaking-temp', 'etc/Spelunking'];
const PAGE_SHOTS = ['dash', 'stamps', 'bubbles', 'printer', 'cooking', 'sailing', 'farming', 'gallery', 'characters', 'cards', 'card-search', 'owl'];
const shotUrl = (name) => `${prefix}etc/whatsnew/pg-${name}.webp`;
// What shows with no save, or a board with nothing on it: the shape of the table, not a claim about the player.
const MINUTE = 60 * 1000;
const SAMPLE_BOARD = {
  ready: [
    { key: 'companion', title: 'Next free companion', icon: 'afk_targets/Dog.png', word: 'Claim' },
    { key: 'trade', title: 'Next sailing trade', icon: 'etc/Blob_Trade.png', word: 'Open' },
    { key: 'library', title: 'Library', icon: 'data/Libz.png', word: 'Full' }
  ],
  comingLabel: 'Next 24 hours',
  coming: [
    { key: 'building', title: 'Closest building', icon: 'data/ConTower19.png', wait: 21 * MINUTE },
    { key: 'trap', title: 'Closest trap', icon: 'data/TrapBoxSet1.png', wait: 350 * MINUTE }
  ]
};

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Lilita+One&display=swap';
// The story opens with its heading font and everybody dressed. A slow connection gets it this soon anyway: a late sheet pops in,
// and the font swaps in when it comes.
const PREPARE_WAIT_MS = 3000;
// Longer than this on the stage is a hold to read, not a tap.
const TAP_MS = 300;
const COUNT_UP_MS = 900;
const LIGHTS_ON_AT_MS = 1100;

const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const loadFont = () => new Promise((resolve) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  link.onload = () => document.fonts.load('40px "Lilita One"').then(resolve, resolve);
  link.onerror = resolve;
  document.head.append(link);
});

const Crowd = ({ crew, spots, phone, held }) => {
  const [walkers] = useState(() => {
    const { innerWidth: width, innerHeight: height } = window;
    return walkIn(spots(crew.length, phone), width, stageUnit(width, height, phone));
  });
  return <div className={css.crowd}>
    {walkers.map((walker) => <CrowdSlot key={walker.index} walker={walker} loadout={crew[walker.index]} held={held}/>)}
  </div>;
};

const CrowdSlot = ({ walker: { x, bottom, w, delay, duration, from, mirrored }, loadout, held }) => {
  const [reduced] = useState(isReduced);
  const [arrived, setArrived] = useState(reduced);
  const walking = !arrived;
  return <div className={css.slot} onAnimationEnd={() => setArrived(true)} data-walker
              style={{
                left: `${x}cqw`, bottom: `calc(var(--u) * ${bottom})`, width: `calc(var(--u) * ${w})`, zIndex: Math.round(100 - bottom),
                '--d': `${delay}ms`, '--dur': `${duration}ms`, '--from': `${from}px`
              }}>
    <StoryDoll loadout={loadout} pose={walking ? WALK : IDLE} pace={reduced ? 0 : walking ? CROWD_PACE : 1} mirrored={mirrored} held={held}/>
  </div>;
};

const Hello = ({ crew, name, phone, held }) => {
  const count = crew.length;
  const line = count === 1 ? 'Your character is here too.' : `Your ${formatNum(count, 'whole')} characters are all here.`;
  return <div className={`${css.slide} ${css.wide}`}>
    <div className={css.helloText}>
      <p className={css.kick}>Welcome back</p>
      <h2 className={css.h}>{name ? `${name}, the Toolbox got rebuilt.` : 'The Toolbox got rebuilt.'}</h2>
      <p className={css.sub}>Every page, top to bottom.{name ? ` ${line}` : ''}</p>
    </div>
    <Crowd crew={crew} spots={helloSpots} phone={phone} held={held}/>
  </div>;
};

// Below 1200 the nav is behind the burger, so "top bar" would be false.
const Menus = ({ burger }) => <div className={css.slide}>
  <div>
    <h2 className={css.h}>The side menu is gone.</h2>
    <p className={css.sub}>{burger ? 'The menu now has Worlds and Account tabs. World 1 to 7 are under Worlds.' : 'Every page now sits in the top bar, under Worlds and Account.'}</p>
  </div>
  <div className={css.menu}>
    <div className={css.navbar}>
      <span className={css.on}>Worlds<IconChevronDown aria-hidden stroke={3}/></span>
      <span>Account<IconChevronDown aria-hidden stroke={3}/></span>
    </div>
    <div className={css.worlds}>
      {WORLD_ICONS.map((icon, index) => <span key={icon} style={{ animationDelay: `${300 + index * 110}ms` }}>
        <img src={`${prefix}${icon}.png`} alt=""/>World {index + 1}
      </span>)}
    </div>
  </div>
</div>;

const CountUp = ({ to }) => {
  const [shown, setShown] = useState(() => (isReduced() ? to : 0));
  useEffect(() => {
    if (isReduced()) return undefined;
    const started = performance.now();
    let frame = null;
    const grow = (now) => {
      const share = Math.min(1, (now - started) / COUNT_UP_MS);
      setShown(Math.round(to * share));
      if (share < 1) frame = requestAnimationFrame(grow);
    };
    frame = requestAnimationFrame(grow);
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return <b data-count={to}>{formatNum(shown, 'whole')}</b>;
};

const Countdown = ({ deadline }) => {
  const now = useNow(1000);
  return <span className={css.time}>{formatDuration(Math.ceil((deadline - now) / 1000))}</span>;
};

const BoardRow = ({ row: { title, icon, word, problem, value, deadline }, delay }) => <div className={css.row} style={{ animationDelay: `${delay}ms` }}>
  {icon ? <img src={`${prefix}${icon}`} alt=""/> : null}
  <span className={css.rowName}>{title}</span>
  {word ? <span className={`${css.word} ${problem ? css.wordProblem : ''}`}>{word}</span>
    : value !== undefined ? <span className={css.time}>{value}</span> : <Countdown deadline={deadline}/>}
</div>;

const Timers = ({ timers }) => {
  const real = timers && timers.ready.length + timers.coming.length > 0;
  const [sample] = useState(() => ({
    ...SAMPLE_BOARD,
    coming: SAMPLE_BOARD.coming.map(({ wait, ...row }) => ({ ...row, deadline: Date.now() + wait }))
  }));
  const board = real ? timers : sample;
  const count = real ? timers.readyCount : 0;
  return <div className={css.slide}>
    <div>
      {count ? <p className={css.count}><CountUp to={count}/>{count === 1 ? 'thing is' : 'things are'} ready right now.</p> : null}
      <h2 className={`${css.h} ${count ? css.hSmall : ''}`}>Timers start with what&apos;s ready.</h2>
      <p className={css.sub}>Then everything else, soonest at the top. One table, all worlds.</p>
    </div>
    <div className={css.table}>
      {board.ready.length ? <div className={css.band}>Ready now</div> : null}
      {board.ready.map((row, index) => <BoardRow key={row.key} row={row} delay={200 + index * 120}/>)}
      {board.coming.length ? <div className={css.band}>{board.comingLabel}</div> : null}
      {board.coming.map((row, index) => <BoardRow key={row.key} row={{ ...row, word: null }} delay={600 + index * 120}/>)}
    </div>
  </div>;
};

const PAGE_OPTIONS = [
  { label: 'Price with gilded stamps', on: true },
  { label: 'Keep a greenstack', on: false },
  { label: 'Best carry capacity', on: true }
];
const PageSettingsSlide = () => <div className={css.slide}>
  <div>
    <h2 className={css.h}>Every page&apos;s options, one button.</h2>
    <p className={css.sub}>Page settings holds what changes a page&apos;s numbers, so the page itself is all yours.</p>
  </div>
  <div className={css.gear}>
    <span className={css.gearButton}><IconSettings aria-hidden/>Page settings</span>
    <div className={css.sheet}>
      {PAGE_OPTIONS.map(({ label, on }, index) => <div key={label} className={css.option}>
        <span>{label}</span>
        <i className={`${css.switch} ${on ? css.switchOn : ''}`} style={{ '--at': `${900 + index * 500}ms` }}/>
      </div>)}
      <div className={css.option}><span>Stamp reducer</span><b>90%</b></div>
    </div>
  </div>
</div>;

const Pages = () => <div className={`${css.slide} ${css.wide}`}>
  <div className={css.marquee} aria-hidden>
    {[PAGE_SHOTS, PAGE_SHOTS.toReversed()].map((shots, index) => <div key={shots[0]} className={`${css.rail} ${index ? css.railBack : ''}`}>
      {[...shots, ...shots].map((name, at) => <img key={`${name}-${at}`} src={shotUrl(name)} alt=""/>)}
    </div>)}
  </div>
  <div className={css.over}>
    <h2 className={css.h}>All {formatNum(PAGE_INDEX.length, 'whole')} pages got the same care.</h2>
    <p className={css.sub}>New cards, new tables, and numbers that read the way the game prints them.</p>
  </div>
</div>;

// Dark and light are one slide in two layers, and the light one wipes in over the dark. Only the one showing can be reached.
const LightsLayer = ({ look, active, lit, onScheme, canTour, onTour, onDone, patchNotes, showSearch, layerRef }) => <div ref={layerRef} className={`${css.layer} ${look}`} inert={!active}>
  <h2 className={css.h}>Lights on.</h2>
  <p className={css.sub}>There&apos;s a light theme now. Pick it from the user menu, Settings or the footer.</p>
  <div className={css.toggle} role="group" aria-label="Theme">
    <button type="button" aria-pressed={!lit} onClick={() => onScheme('dark')}>Dark</button>
    <button type="button" aria-pressed={lit} onClick={() => onScheme('light')}>Light</button>
  </div>
  <p className={`${css.sub} ${css.small}`}>
    Plus lots of smaller changes, all in the {patchNotes}.{showSearch ? ' Can\'t find a page? Ctrl + K searches them all.' : ''}
  </p>
  <div className={css.actions}>
    {canTour ? <button type="button" data-first className={`${css.action} ${css.main} ${css.glow}`} onClick={onTour}>Show me around</button> : null}
    <button type="button" data-first={canTour ? undefined : true} className={`${css.action} ${canTour ? '' : css.main}`} onClick={onDone}>Got it</button>
  </div>
</div>;

const Lights = ({ crew, phone, burger, held, onTour, onDone }) => {
  const router = useRouter();
  const { setMode } = useColorScheme();
  const [lit, setLit] = useState(false);
  const touch = useMediaQuery('(pointer: coarse)');
  const darkLayer = useRef(null);
  const lightLayer = useRef(null);

  useEffect(() => {
    if (isReduced()) return undefined;
    const timer = setTimeout(() => setLit(true), LIGHTS_ON_AT_MS);
    return () => clearTimeout(timer);
  }, []);

  // The layer that was showing has gone inert, and the keyboard's place with it.
  useEffect(() => {
    (lit ? lightLayer : darkLayer).current?.querySelector('[data-first]')?.focus({ preventScroll: true });
  }, [lit]);

  // The toggle is the real thing: a press sets the site's theme. The wipe by itself only shows it off.
  const onScheme = (scheme) => {
    setLit(scheme === 'light');
    setMode(scheme);
    trackEvent('whats_new_story_theme', { step: scheme });
  };
  const patchNotes = <NextLink href={{ pathname: '/patch-notes', query: sessionQuery(router.query) }} onClick={onDone}>patch notes</NextLink>;
  const shared = { lit, onScheme, canTour: !burger, onTour, onDone, patchNotes, showSearch: !touch && !phone };
  return <div className={`${css.slide} ${css.wide}`}>
    <LightsLayer {...shared} look={css.dark} active={!lit} layerRef={darkLayer}/>
    <div className={`${css.lit} ${lit ? css.litOn : ''}`}>
      <LightsLayer {...shared} look={css.light} active={lit} layerRef={lightLayer}/>
    </div>
    <Crowd crew={crew} spots={lastSpots} phone={phone} held={held}/>
  </div>;
};

const Story = ({ crew, name, timers, onDone }) => {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);
  const [next, setNext] = useState(null);
  const [at, setAt] = useState(0);
  const [reduced] = useState(isReduced);
  const phone = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const burger = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const stage = useRef(null);
  const bars = useRef(null);
  const walker = useRef(null);
  const held = useRef(false);
  const pressedAt = useRef(0);
  const seen = useRef(new Set());
  const slide = SLIDES[at];
  const last = at === LAST;
  const walking = !reduced && !last && at > 0;
  const [pace] = useState(() => {
    const width = window.innerWidth;
    return walkerPace(width, (phone ? 34 : 13) * stageUnit(width, window.innerHeight, phone));
  });

  useEffect(() => {
    let gone = false;
    [...PAGE_SHOTS.map(shotUrl), ...WORLD_ICONS.map((icon) => `${prefix}${icon}.png`)].forEach((url) => {
      new Image().src = url;
    });
    const waited = new Promise((resolve) => {
      setTimeout(resolve, PREPARE_WAIT_MS);
    });
    Promise.race([Promise.all([loadFont(), prepareCrew(crew)]), waited]).then(() => {
      if (!gone) setReady(true);
    });
    return () => {
      gone = true;
    };
  }, [crew]);

  useEffect(() => {
    if (!ready || seen.current.has(slide.step)) return;
    seen.current.add(slide.step);
    trackEvent('whats_new_story_step', { step: slide.step });
  }, [ready, slide]);

  // The clock runs outside React: the bar and the walker move every frame, and only a new slide renders.
  useEffect(() => {
    if (!ready || reduced || !slide.ms) return undefined;
    let elapsed = 0;
    let previous = performance.now();
    let frame = null;
    const tick = (now) => {
      if (!held.current) elapsed += now - previous;
      previous = now;
      const fill = bars.current?.children[at]?.firstChild;
      if (fill) fill.style.width = `${Math.min(100, (elapsed / slide.ms) * 100)}%`;
      if (walker.current) {
        const size = walker.current.offsetWidth;
        walker.current.style.transform = `translateX(${-size + (elapsed / WALKER_CROSSING_MS) * (stage.current.clientWidth + size)}px)`;
      }
      if (elapsed >= slide.ms) {
        setAt(at + 1);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready, reduced, slide, at]);

  const go = (index) => {
    if (SLIDES[index]) setAt(index);
  };
  const hold = (value) => {
    held.current = value;
    stage.current?.classList.toggle(css.held, value);
  };
  const close = () => {
    trackEvent('whats_new_story_close', { step: slide.step });
    setOpen(false);
  };
  const showAround = () => {
    trackEvent('whats_new_tour_start');
    setNext('tour');
    setOpen(false);
  };
  const skip = () => {
    trackEvent('whats_new_story_skip', { step: slide.step });
    go(LAST);
  };
  const onPointerDown = () => {
    pressedAt.current = performance.now();
    hold(true);
  };
  const onPointerUp = (event) => {
    hold(false);
    if (event.target.closest('button, a') || performance.now() - pressedAt.current > TAP_MS) return;
    const box = stage.current.getBoundingClientRect();
    go(event.clientX - box.left < box.width * 0.3 ? at - 1 : at + 1);
  };
  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') go(at + 1);
    if (event.key === 'ArrowLeft') go(at - 1);
    if (event.key === ' ' && !event.target.closest('button, a')) {
      event.preventDefault();
      hold(!held.current);
    }
  };

  if (!ready) return null;

  const body = {
    hello: <Hello crew={crew} name={name} phone={phone} held={held}/>,
    menus: <Menus burger={burger}/>,
    timers: <Timers timers={timers}/>,
    page_settings: <PageSettingsSlide/>,
    pages: <Pages/>,
    lights: <Lights crew={crew} phone={phone} burger={burger} held={held} onTour={showAround} onDone={close}/>
  }[slide.step];

  return <Modal open={open} onClose={close} hideBackdrop closeAfterTransition>
    <Fade in={open} timeout={reduced ? 0 : 180} onExited={() => onDone(next)}>
      <div ref={stage} role="dialog" aria-modal="true" aria-label="What's new" tabIndex={-1} data-step={slide.step}
           className={`${css.stage} ${slide.look}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}
           onPointerCancel={() => hold(false)} onKeyDown={onKeyDown}>
        <div key={slide.step} className={css.body} aria-live="polite">{body}</div>
        {walking ? <div key={`walker-${at}`} ref={walker} className={css.walker}>
          <StoryDoll loadout={crew[(at + 4) % crew.length]} pose={WALK} pace={pace} named={false} held={held}/>
        </div> : null}
        <div ref={bars} className={css.bars} aria-hidden>
          {SLIDES.map(({ step, ms }, index) => <span key={step}><i style={index === at && ms && !reduced ? undefined : { width: index <= at ? '100%' : 0 }}/></span>)}
        </div>
        {last ? null : <button type="button" className={css.skip} onClick={skip}>Skip</button>}
        {at > 0 ? <button type="button" className={`${css.step} ${css.back}`} onClick={() => go(at - 1)}>Back</button> : null}
        {last ? null : <button type="button" className={`${css.step} ${css.next}`} onClick={() => go(at + 1)}>Next</button>}
      </div>
    </Fade>
  </Modal>;
};

// The numbers are the Timers table's own, read once as the story opens.
const SaveTimers = ({ state, render }) => {
  const { config } = loadTrackers(baseTrackers, state?.trackers);
  const rows = useTimerRows({
    characters: state?.characters, account: state?.account, lastUpdated: state?.lastUpdated, trackers: config?.timers,
    bookAlert: config?.account?.['World 3']?.library, bossAlert: config?.account?.General?.etc
  });
  const [timers] = useState(() => timersInBrief(rows, Date.now()));
  return render(timers);
};

// Replaces the old dialog: one idea to a slide, each in a World's colours, with the player's own characters and numbers. With no
// save it keeps the story and drops the claims. Esc is Got it. Mounted only once it opens, on a client that knows its window, so
// the media queries read true on the first render and everything inside it may read the window as it draws.
const WhatsNewStory = ({ onDone }) => {
  const { state } = useContext(AppContext);
  const characters = state?.characters ?? [];
  const saved = characters.length > 0 && !state?.account?.failedSections?.includes('*');
  const [crew] = useState(() => (saved ? characters.map((character) => loadoutFromCharacter(character, items)) : sampleCrew(items)));
  const story = (timers) => <Story crew={crew} name={saved ? crew[0].name : null} timers={timers} onDone={onDone}/>;
  if (!saved) return story(null);
  // A Timers table that can't read this save costs the slide its number, never the story.
  return <ErrorBoundary wrap={() => story(null)}>
    <SaveTimers state={state} render={story}/>
  </ErrorBoundary>;
};

export default WhatsNewStory;

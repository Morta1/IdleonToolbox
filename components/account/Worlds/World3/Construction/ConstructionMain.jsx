import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import {
  bestValuePlan,
  countBoardCharacters,
  curvePlans,
  getBoardAtStep,
  isCharacterCog,
  WEIGHTED_STAT
} from '@parsers/world-3/construction';
import {
  Box,
  CircularProgress,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { formatNum } from '@utility/helpers';
import NumberField from '@components/common/NumberField';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MenuItem from '@mui/material/MenuItem';
import ConstructionBoard, { BOARD_MIN_WIDTH } from './ConstructionBoard';
import ConstructionStats from './ConstructionStats';
import ConstructionSmallCogs from './ConstructionSmallCogs';
import ConstructionMoves from './ConstructionMoves';
import { useConstructionOptimizer } from '@hooks/useConstructionOptimizer';
import useToolbarState from '@hooks/useToolbarState';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import usePageTop from '@hooks/usePageTop';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import { notify } from '@components/common/Overlays/notify';
import Toolbar from '@components/common/Toolbar';
import InfoButton from '@components/common/InfoButton';
import Notice from '@components/common/Notice';

// The board pins under the fixed nav bar so it stays in view while the steps list scrolls beside it:
// the step highlight is useless if the board it lights up is three screens away.

// Side by side needs the whole board plus a list wide enough to read a step in. The content area is
// the viewport less the drawer and the 300px ad gutter (roughly 620px of it is gone before the page
// gets any), so the cutoff sits well above MUI's `lg`. At 1200 the steps would get about 80px, and
// even at 1400 every row truncates mid-label. Below this the two stack instead.
const SIDE_BY_SIDE = '@media (min-width: 1500px)';

// The board's view, remembered with the tab's toolbar
const BOARD_TOOLBAR = { view: 'build' };
const VIEWS = [['build', 'Build'], ['buildPercent', 'Build %'], ['exp', 'EXP'], ['playerExp', 'Player EXP boost'], ['flaggy', 'Flaggy']];

// Picking a stat to optimize also switches the board to the view that shows it. Balanced mode
// touches several stats at once, so it leaves whatever view you were on alone.
const VIEW_BY_STAT = {
  totalBuildRate: 'build',
  totalPlayerExpRate: 'exp'
};

// Seconds, so nobody has to reason in milliseconds. Capped because the search is time-boxed anyway
// and the gains past ~15s are tiny.
const COMPUTE_PRESETS = [
  { label: 'Quick', seconds: 1 },
  { label: 'Normal', seconds: 3 },
  { label: 'Thorough', seconds: 10 },
  { label: 'Max', seconds: 30 }
];

// A plan can come out behind the board you have: the character cap benches characters before the
// search starts, and their build rate goes with them. That is worth showing rather than hiding, so
// the sign comes from the number instead of being assumed.
const formatGain = (gain) => formatNum((gain ?? 0) * 100, 'pct', { signed: true, precise: true });

// A plan card holds two lines, so it grows past the theme's button height instead of being pinned to it
const PLAN_CARD_SX = { px: 2.5, py: 1, minWidth: 96, height: 'auto', minHeight: 40, '@media (pointer: coarse)': { minHeight: 44 } };

const legendItem = (color, label) => <Stack key={label} direction={'row'} alignItems={'center'} gap={0.5}>
  <Box sx={{ width: 12, height: 12, borderRadius: '2px', border: 2, borderColor: color }}/>
  <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>{label}</Typography>
</Stack>;

// The slot notes' rounding, in Construction's gear under the tab's name (not remembered before it moved there)
export const CONSTRUCTION_SETTINGS = { roundCogStats: true };

export const ConstructionSettings = () => <PageSettings.Group title={'Main'}>
  <PageSettings.Toggle name={'roundCogStats'} label={'Round cog stats'} help={'Rounds the numbers in each slot\'s note to whole numbers. Off, they show every digit.'}/>
</PageSettings.Group>;

const ConstructionMain = () => {
  const { state } = useContext(AppContext);
  // Under the bar and the band while it shows, and under the View toolbar once it pins
  const pageTop = usePageTop();
  const [toolbarBottom, setToolbarBottom] = useState(0);
  const stickyTop = Math.max(pageTop, toolbarBottom) + 8;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('construction-board', BOARD_TOOLBAR);
  const view = toolbar?.view ?? 'build';
  const [settings] = usePageSettings('construction', CONSTRUCTION_SETTINGS);
  const roundedValues = Boolean(settings?.roundCogStats);
  const [stat, setStat] = useState('totalBuildRate');
  const [weights, setWeights] = useState({ totalBuildRate: 1, totalPlayerExpRate: 1, totalFlaggyRate: 1 });
  const [computeSeconds, setComputeSeconds] = useState(3);
  // Two by default. Characters on the board stop making cogs, and left to itself the optimizer sends
  // every one of them out, so the starting point is a couple rather than the whole roster. Clamped
  // for anyone who has fewer than that to begin with.
  const [maxCharacters, setMaxCharacters] = useState(() => Math.min(2, countBoardCharacters(state?.account?.construction?.baseBoard)
    + (state?.account?.construction?.spareCogs ?? []).filter(isCharacterCog).length));
  const [current, setCurrent] = useState(state?.account?.construction);
  // Which plan on the curve is on screen. undefined leaves it on whichever budget the curve says is
  // the best value, so the common case needs no decision at all.
  const [planBudget, setPlanBudget] = useState(undefined);
  const [cursor, setCursor] = useState(0);
  const [hoverHighlight, setHoverHighlight] = useState(null);
  const [exportsAnchor, setExportsAnchor] = useState(null);
  const columnsRef = useRef(null);
  const stripRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(null);
  const { status, progress, gain, result: curve, error, run, cancel, reset } = useConstructionOptimizer();
  const running = status === 'running';
  // Every budget searched, cheapest first, with the unbudgeted search last when it is a board of its
  // own. Picking one swaps which plan the board, the stats and the steps list are all showing.
  const plans = curvePlans(curve);
  const suggested = curve ? bestValuePlan(curve) : null;
  const optimized = planBudget === undefined
    ? suggested
    : (plans.find(({ maxSwaps }) => maxSwaps === planBudget) ?? suggested);
  // One board that walks the plan: cursor 0 is the board you have now, the last step is the optimized
  // one, and everything between is what your board looks like partway through applying it.
  const moves = optimized?.moves;
  const stepped = optimized
    ? getBoardAtStep(current?.baseBoard, current?.spareCogs ?? [], moves, cursor, state?.characters)
    : null;
  const shownBoard = stepped?.board ?? current?.board;
  // Flag unlock ETAs are read off the board on screen, so a partway-through step reports the rate
  // that step would run at. evaluateBoard returns the raw sum, which still needs the gem multiplier
  // the parser applies to the totals it stores.
  const shownFlaggyRate = stepped
    ? stepped.totalFlaggyRate * (current?.boardMultipliers?.flaggy ?? 1)
    : current?.totalFlaggyRate;
  // Everyone who could stand on the board: those already on it, plus the rack the spares come from.
  const totalCharacters = countBoardCharacters(state?.account?.construction?.baseBoard)
    + (state?.account?.construction?.spareCogs ?? []).filter(isCharacterCog).length;
  // The steps list labels each cog with the number the board shows for it right before that swap,
  // which carries the neighbour boosts of that step. Inventory cogs are never boosted, so their own
  // stats already are that number.
  const boardsBeforeStep = moves?.map((_, step) =>
    getBoardAtStep(current?.baseBoard, current?.spareCogs ?? [], moves, step, state?.characters)?.board);
  const cogsByOriginalIndex = Object.fromEntries([...(current?.baseBoard ?? []).map((slot) => slot?.cog), ...(current?.spareCogs ?? [])]
    .filter(Boolean)
    .map((cog) => [cog.originalIndex, cog]));
  const nextMove = moves?.[cursor];
  // Hovering a row previews that swap; otherwise the board points at the one you are up to.
  const highlightSlots = hoverHighlight ?? (nextMove ? [nextMove.fromSlot, nextMove.to] : null);

  // Once pinned the panel could be a whole viewport tall, but it does not start pinned: it sits
  // below the toolbar and the controls, so a 100vh panel hangs off the bottom of the screen and the
  // list has to be scrolled to before it can be read. Size it to the room it actually has instead.
  // The row is not sticky, so its offset stays put and can be measured at any scroll position.
  useEffect(() => {
    const measure = () => {
      const row = columnsRef.current;
      if (!row) return;
      const docTop = row.getBoundingClientRect().top + window.scrollY;
      setPanelHeight(Math.max(320, Math.round(window.innerHeight - docTop - 16)));
    };
    measure();
    // Everything above the row decides where it starts, and that moves: a result adds numbers to the
    // stats, the weighted inputs appear and disappear, and account data can land after the first
    // render. Watching the strip catches all of it: the panel height never feeds back into it.
    const observer = new ResizeObserver(measure);
    if (stripRef.current) observer.observe(stripRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const handleCopy = async (data, label) => {
    const copied = await copyText(data);
    notify(copied ? `${label} copied to clipboard` : CLIPBOARD_ERROR_MESSAGE);
  };

  const handleStatChange = (nextStat) => {
    setStat(nextStat);
    if (VIEW_BY_STAT[nextStat]) setToolbar({ view: VIEW_BY_STAT[nextStat] });
  };

  const handleOptimize = () => {
    const construction = state?.account?.construction;
    setCurrent(construction);
    setHoverHighlight(null);
    setCursor(0);
    setPlanBudget(undefined);
    run(structuredClone(construction?.baseBoard), {
      stat,
      weights,
      time: Math.round(Math.min(60, Math.max(0, Number(computeSeconds) || 0)) * 1000),
      // Only the two fields compileCog reads: the full character objects are megabytes to clone.
      characters: state?.characters?.map(({ name, constructionExpPerHour }) => ({ name, constructionExpPerHour })),
      spareCogs: structuredClone(construction?.spareCogs ?? []),
      multipliers: construction?.boardMultipliers,
      maxCharacters: Math.max(0, Math.min(totalCharacters, Math.trunc(Number(maxCharacters) || 0)))
    }, 'curve');
  }

  const handlePlanChange = (maxSwaps) => {
    setPlanBudget(maxSwaps);
    setHoverHighlight(null);
    setCursor(0);
  }

  const handleWeightChange = (key, value) => setWeights((previous) => ({
    ...previous,
    [key]: Math.max(0, Number(value) || 0)
  }));

  return (
    <>
      {/* One block, one set of left and right edges. The board, the toolbar above it and the rail
          beside it all line up, and the leftover width sits evenly on both sides. */}
      <Stack gap={2} sx={{ width: '100%', maxWidth: 1500, mx: 'auto' }}>
        <ConstructionStats construction={state?.account?.construction} optimized={optimized}/>
        {/* A direct child of the tab's block, so it pins over the board while the tab scrolls (as on Buildings); the
            board and the steps pin under it */}
        <Toolbar state={toolbar} defaults={BOARD_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 onStickyBottom={setToolbarBottom}>
          <Toolbar.View options={VIEWS}/>
        </Toolbar>

        {/* The optimizer's controls run across the top: wide-and-short by nature, keeping them out of the
            right column leaves the whole viewport height for the steps list. */}
        <Paper ref={stripRef} variant={'outlined'} sx={{ p: 2, minWidth: 0 }}>
          <Stack gap={1}>
            <Stack direction={'row'} gap={2} rowGap={1.5} flexWrap={'wrap'} alignItems={'flex-end'}>
              <TextField select label={'Optimize for'} value={stat} disabled={running} sx={{ minWidth: 180 }}
                         onChange={(event) => handleStatChange(event.target.value)}>
                <MenuItem value={'totalBuildRate'}>Build speed</MenuItem>
                <MenuItem value={'totalPlayerExpRate'}>Player XP rate</MenuItem>
                <MenuItem value={WEIGHTED_STAT}>Balanced (weighted)</MenuItem>
              </TextField>
              {stat === WEIGHTED_STAT ? [
                ['totalBuildRate', 'Build'],
                ['totalPlayerExpRate', 'Player XP'],
                ['totalFlaggyRate', 'Flaggy']
              ].map(([key, label]) => <NumberField key={key}
                                                   label={label}
                                                   value={weights[key]}
                                                   min={0}
                                                   help={false}
                                                   disabled={running}
                                                   sx={{ width: 76 }}
                                                   onChange={(next) => handleWeightChange(key, next ?? 0)}/>) : null}
              {totalCharacters > 0 ? <Stack direction={'row'} alignItems={'center'} gap={0.75}>
                {/* No help line: it would drop this field out of line with the rest of the flex-end row */}
                <NumberField label={'Max characters'}
                             value={maxCharacters === '' ? null : Number(maxCharacters)}
                             min={0}
                             max={totalCharacters}
                             integer
                             help={false}
                             disabled={running}
                             sx={{ width: 120 }}
                             onChange={(next) => setMaxCharacters(next ?? '')}/>
                <InfoButton label={'Max characters'}>
                  Characters on the board stop making cogs, so the optimizer only uses this many.
                </InfoButton>
              </Stack> : null}
              <Stack gap={0.5}>
                <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>Effort</Typography>
                <ToggleButtonGroup exclusive value={computeSeconds} disabled={running} aria-label={'Effort'}
                                   onChange={(e, value) => (value ? setComputeSeconds(value) : null)}>
                  {COMPUTE_PRESETS.map(({ label, seconds }) => <ToggleButton key={label} value={seconds}>
                    {label}
                  </ToggleButton>)}
                </ToggleButtonGroup>
              </Stack>
              {running
                ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <CircularProgress size={16}/>
                  <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
                    {gain > 0 ? `${formatNum(gain * 100, 'pct', { signed: true, precise: true })} so far` : 'Searching…'}
                  </Typography>
                  <Button color={'inherit'} onClick={cancel}>Cancel</Button>
                </Stack>
                : <Stack direction={'row'} gap={1}>
                  <Button variant={'contained'} onClick={handleOptimize}>Optimize</Button>
                  {optimized
                    ? <Button color={'inherit'} onClick={() => { reset(); setCursor(0); setPlanBudget(undefined); }}>Clear</Button>
                    : null}
                </Stack>}
              {/* The exports are a once-in-a-while thing, so they sit in a menu rather than taking a row: at the strip's end,
                  since they feed another optimizer */}
              <Box sx={{ flexGrow: 1 }}/>
              <Button aria-haspopup={'menu'} aria-expanded={!!exportsAnchor}
                      onClick={({ currentTarget }) => setExportsAnchor(currentTarget)}>Cogstruction</Button>
              <Menu anchorEl={exportsAnchor} open={!!exportsAnchor} onClose={() => setExportsAnchor(null)}>
                <MenuItem onClick={() => {
                  setExportsAnchor(null);
                  handleCopy(state?.account?.construction?.cogstruction?.cogData, 'Cogstruction data');
                }}>
                  <ListItemIcon><FileCopyIcon/></ListItemIcon><ListItemText>Copy Cogstruction data</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  setExportsAnchor(null);
                  handleCopy(state?.account?.construction?.cogstruction?.empties, 'Cogstruction empties');
                }}>
                  <ListItemIcon><FileCopyIcon/></ListItemIcon><ListItemText>Copy Cogstruction empties</ListItemText>
                </MenuItem>
                {/* The copies are for Cogstruction; its page is a row, so the keyboard reaches it */}
                <MenuItem component={'a'} href={'https://github.com/automorphis/Cogstruction'} target={'_blank'}
                          rel={'noreferrer'} onClick={() => setExportsAnchor(null)}>
                  <ListItemIcon><OpenInNewIcon/></ListItemIcon><ListItemText>Cogstruction on GitHub</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>
            {running ? <LinearProgress variant={'determinate'} value={progress * 100}
                                       sx={{ height: 6, borderRadius: 3 }}/> : null}
            {error ? <Notice tone={'error'}>{error}</Notice> : null}
            {/* Nobody knows up front whether the swaps worth making run out at three or at fifteen,
                so the run answers it: each budget with what it actually buys. The cheapest one that
                already gets effectively the whole gain starts selected. */}
            {plans.length > 0 && !running
              ? <Stack gap={0.5}>
                <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                  <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>Plan</Typography>
                  <InfoButton label={'Plan'}>
                    How much of the gain each swap budget buys. Fewer swaps means less dragging in game, and the gain
                    usually flattens out well before the full plan.
                  </InfoButton>
                </Stack>
                <ToggleButtonGroup exclusive value={optimized?.maxSwaps ?? null} aria-label={'Plan'}
                                   onChange={(e, value) => (value === undefined ? null : handlePlanChange(value))}
                                   sx={{ flexWrap: 'wrap', gap: 0.75, '& .MuiToggleButtonGroup-grouped': {
                                     border: 1, borderColor: 'divider', borderRadius: 1
                                   } }}>
                  {plans.map(({ maxSwaps, gain: planGain, moves: planMoves }) => <ToggleButton
                    key={maxSwaps ?? 'all'} value={maxSwaps} sx={PLAN_CARD_SX}>
                    <Stack alignItems={'center'} gap={0.25}>
                      <Typography variant={'caption'} sx={{ lineHeight: 1.4 }}>
                        {maxSwaps === null
                          ? `All ${planMoves?.length ?? 0}`
                          : `${planMoves?.length ?? 0} swap${planMoves?.length === 1 ? '' : 's'}`}
                      </Typography>
                      <Typography variant={'caption'} sx={{ color: 'text.secondary', lineHeight: 1.4 }}>
                        {formatGain(planGain)}
                      </Typography>
                    </Stack>
                  </ToggleButton>)}
                </ToggleButtonGroup>
                {suggested?.maxSwaps !== null && optimized?.maxSwaps === suggested?.maxSwaps
                && !curve?.unlimited?.redundant
                  ? <Typography variant={'caption'} sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {suggested.moves?.length} swaps get
                    you {formatNum((suggested.gain / (curve.unlimited.gain || suggested.gain)) * 100, 'pct')} of
                    the full {curve.unlimited.moves?.length}-swap plan.
                  </Typography>
                  : null}
              </Stack>
              : null}
          </Stack>
        </Paper>
        <Box ref={columnsRef} sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          width: '100%',
          [SIDE_BY_SIDE]: { flexDirection: 'row', alignItems: 'flex-start' }
        }}>
          {/* Both columns flex and the board sizes its slots to the width it lands with, so the two
              share the row instead of the board claiming a fixed width and starving the list. It
              still refuses to shrink past a whole board, which is what the min width is for. */}
          <Stack gap={1} sx={{
            minWidth: 0,
            maxWidth: '100%',
            [SIDE_BY_SIDE]: {
              flex: '2 1 0',
              minWidth: `${BOARD_MIN_WIDTH}px`,
              position: 'sticky',
              top: `${stickyTop}px`
            }
          }}>
            <ConstructionBoard view={view}
                               roundedValues={roundedValues}
                               markSpares={!!optimized}
                               dimUnchanged={cursor > 0}
                               highlightSlots={highlightSlots}
                               board={shownBoard}
                               boardFlaggyRate={shownFlaggyRate}
                               leftColumn={state?.account?.construction?.leftColumn}
                               rightColumn={state?.account?.construction?.rightColumn}/>
            {/* Only the legend lives under the board: Back and Next moved into the steps panel,
                which is always on screen. */}
            {moves?.length > 0 ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              {legendItem('primary.main', 'The step you are on')}
              {legendItem('success.main', 'Pulled from cog inventory')}
              {cursor > 0
                ? <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>Faded cogs never move</Typography>
                : null}
            </Stack> : null}
          </Stack>
          {/* The steps list is the only thing beside the board now, so it gets the full viewport
              height and scrolls inside itself. Otherwise advancing a step scrolls the whole page,
              which drags the board out from under you. */}
          <Paper variant={'outlined'} sx={{
            p: 2,
            display: 'flex',
            minWidth: 0,
            width: '100%',
            // Stacked under the board it still gets a ceiling, so a 90 step plan scrolls in place
            // instead of turning the page into a mile of list.
            maxHeight: '70vh',
            [SIDE_BY_SIDE]: {
              flex: '1 1 0',
              maxWidth: 620,
              position: 'sticky',
              top: `${stickyTop}px`,
              maxHeight: panelHeight ? `${panelHeight}px` : `calc(100vh - ${stickyTop + 16}px)`
            }
          }}>
            {optimized
              ? <ConstructionMoves moves={moves} cursor={cursor} onCursorChange={setCursor}
                                   onHover={setHoverHighlight}
                                   view={view}
                                   boardsBeforeStep={boardsBeforeStep}
                                   cogsByOriginalIndex={cogsByOriginalIndex}/>
              : <Stack gap={1} sx={{ alignSelf: 'center', mx: 'auto', textAlign: 'center', py: 4 }}>
                <Typography variant={'sectionTitle'} component={'h2'}>Steps to apply</Typography>
                <Typography variant={'body2'} sx={{ color: 'text.secondary', maxWidth: 320 }}>
                  Hit Optimize and the swaps to get there show up here, one at a time, with the board
                  beside them following along.
                </Typography>
              </Stack>}
          </Paper>
        </Box>
        <ConstructionSmallCogs smallCogs={state?.account?.construction?.smallCogs}/>
      </Stack>
    </>
  );
}

export default ConstructionMain;

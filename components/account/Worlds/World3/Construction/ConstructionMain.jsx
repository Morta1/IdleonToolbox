import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { countBoardCharacters, getBoardAtStep, isCharacterCog, WEIGHTED_STAT } from '@parsers/world-3/construction';
import {
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  Menu,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import Tooltip from '../../../../Tooltip';
import Link from '@mui/material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import Button from '@mui/material/Button';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import MenuItem from '@mui/material/MenuItem';
import ConstructionBoard, { BOARD_MIN_WIDTH } from './ConstructionBoard';
import ConstructionStats from './ConstructionStats';
import ConstructionSmallCogs from './ConstructionSmallCogs';
import ConstructionMoves from './ConstructionMoves';
import { useConstructionOptimizer } from '@hooks/useConstructionOptimizer';
import { navBarHeight } from '@components/constants';

// The board pins under the fixed nav bar so it stays in view while the steps list scrolls beside it -
// the step highlight is useless if the board it lights up is three screens away.
const STICKY_TOP = navBarHeight + 8;

// Side by side needs the whole board plus a list wide enough to read a step in. The content area is
// the viewport less the drawer and the 300px ad gutter - roughly 620px of it is gone before the page
// gets any - so the cutoff sits well above MUI's `lg`. At 1200 the steps would get about 80px, and
// even at 1400 every row truncates mid-label. Below this the two stack instead.
const SIDE_BY_SIDE = '@media (min-width: 1500px)';

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

const LegendItem = ({ color, label }) => <Stack direction={'row'} alignItems={'center'} gap={0.5}>
  <Box sx={{ width: 12, height: 12, borderRadius: '2px', border: `2px solid ${color}` }}/>
  <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>{label}</Typography>
</Stack>;

const ConstructionMain = () => {
  const { state } = useContext(AppContext);
  const [view, setView] = useState('build');
  const [showTooltip, setShowTooltip] = useState(true);
  const [roundedValues, setRoundedValues] = useState(true);
  const [stat, setStat] = useState('totalBuildRate');
  const [weights, setWeights] = useState({ totalBuildRate: 1, totalPlayerExpRate: 1, totalFlaggyRate: 1 });
  const [computeSeconds, setComputeSeconds] = useState(3);
  // Two by default. Characters on the board stop making cogs, and left to itself the optimizer sends
  // every one of them out, so the starting point is a couple rather than the whole roster. Clamped
  // for anyone who has fewer than that to begin with.
  const [maxCharacters, setMaxCharacters] = useState(() => Math.min(2, countBoardCharacters(state?.account?.construction?.baseBoard)
    + (state?.account?.construction?.spareCogs ?? []).filter(isCharacterCog).length));
  const [current, setCurrent] = useState(state?.account?.construction);
  const [cursor, setCursor] = useState(0);
  const [hoverHighlight, setHoverHighlight] = useState(null);
  const [copied, setCopied] = useState('');
  const [optionsAnchor, setOptionsAnchor] = useState(null);
  const columnsRef = useRef(null);
  const stripRef = useRef(null);
  const [panelHeight, setPanelHeight] = useState(null);
  const { status, progress, gain, result: optimized, error, run, cancel, reset } = useConstructionOptimizer();
  const running = status === 'running';
  // One board that walks the plan: cursor 0 is the board you have now, the last step is the optimized
  // one, and everything between is what your board looks like partway through applying it.
  const moves = optimized?.moves;
  const stepped = optimized
    ? getBoardAtStep(current?.baseBoard, current?.spareCogs ?? [], moves, cursor, state?.characters)
    : null;
  const shownBoard = stepped?.board ?? current?.board;
  // Everyone who could stand on the board: those already on it, plus the rack the spares come from.
  const totalCharacters = countBoardCharacters(state?.account?.construction?.baseBoard)
    + (state?.account?.construction?.spareCogs ?? []).filter(isCharacterCog).length;
  const nextMove = moves?.[cursor];
  // Hovering a row previews that swap; otherwise the board points at the one you are up to.
  const highlightSlots = hoverHighlight ?? (nextMove ? [nextMove.fromSlot, nextMove.to] : null);

  // Once pinned the panel could be a whole viewport tall, but it does not start pinned - it sits
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
    // render. Watching the strip catches all of it - the panel height never feeds back into it.
    const observer = new ResizeObserver(measure);
    if (stripRef.current) observer.observe(stripRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const handleCopy = async (data, label) => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(`${label} copied to clipboard`);
    } catch (err) {
      console.error(err);
      setCopied('Could not copy - your browser blocked clipboard access');
    }
  };

  const handleStatChange = (nextStat) => {
    setStat(nextStat);
    if (VIEW_BY_STAT[nextStat]) setView(VIEW_BY_STAT[nextStat]);
  };

  const handleOptimize = () => {
    const construction = state?.account?.construction;
    setCurrent(construction);
    setHoverHighlight(null);
    setCursor(0);
    run(structuredClone(construction?.baseBoard), {
      stat,
      weights,
      time: Math.round(Math.min(60, Math.max(0, Number(computeSeconds) || 0)) * 1000),
      // Only the two fields compileCog reads - the full character objects are megabytes to clone.
      characters: state?.characters?.map(({ name, constructionExpPerHour }) => ({ name, constructionExpPerHour })),
      spareCogs: structuredClone(construction?.spareCogs ?? []),
      multipliers: construction?.boardMultipliers,
      maxCharacters: Math.max(0, Math.min(totalCharacters, Math.trunc(Number(maxCharacters) || 0)))
    });
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
        <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
          <ToggleButtonGroup size={'small'} value={view} exclusive
                             onChange={(e, value) => (value?.length ? setView(value) : null)}>
            <ToggleButton value="build">Build</ToggleButton>
            <ToggleButton value="buildPercent">Build %</ToggleButton>
            <ToggleButton value="exp">Exp</ToggleButton>
            <ToggleButton value="playerExp">Player Exp boost</ToggleButton>
            <ToggleButton value="flaggy">Flaggy</ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ flexGrow: 1 }}/>
          {/* The exports are a once-in-a-while thing, so they sit in the menu rather than taking a
              row that the stats and optimize controls now need. */}
          <Tooltip title={'Display options and exports'} followCursor={false}>
            <IconButton size={'small'} onClick={({ currentTarget }) => setOptionsAnchor(currentTarget)}>
              <SettingsIcon fontSize={'small'}/>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={optionsAnchor} open={!!optionsAnchor} onClose={() => setOptionsAnchor(null)}>
            <MenuItem onClick={() => setShowTooltip(!showTooltip)}>
              <Checkbox size={'small'} checked={showTooltip}/> Show tooltip
            </MenuItem>
            <MenuItem onClick={() => setRoundedValues(!roundedValues)}>
              <Checkbox size={'small'} checked={roundedValues}/> Rounded values
            </MenuItem>
            <Divider/>
            <MenuItem onClick={() => {
              setOptionsAnchor(null);
              handleCopy(state?.account?.construction?.cogstruction?.cogData, 'Cogstruction data');
            }}>
              <FileCopyIcon fontSize={'small'} sx={{ mr: 1 }}/> Copy Cogstruction data
            </MenuItem>
            <MenuItem onClick={() => {
              setOptionsAnchor(null);
              handleCopy(state?.account?.construction?.cogstruction?.empties, 'Cogstruction empties');
            }}>
              <FileCopyIcon fontSize={'small'} sx={{ mr: 1 }}/> Copy Cogstruction empties
            </MenuItem>
            <Box sx={{ px: 2, pt: 0.5, maxWidth: 260 }}>
              <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
                For use in{' '}
                <Link target={'_blank'} underline={'always'} color={'info.main'}
                      href="https://github.com/automorphis/Cogstruction" rel="noreferrer">
                  Cogstruction
                </Link>
              </Typography>
            </Box>
          </Menu>
        </Stack>

        {/* Controls and readouts run across the top: both are wide-and-short by nature, and keeping
            them out of the right column leaves the whole viewport height for the steps list. */}
        <Stack ref={stripRef} direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={'stretch'}>
          {/* The controls take what they need and the stats get the rest - wide enough to keep all
              four on one line, which is what decides how far down the page the steps panel starts. */}
          <Paper variant={'outlined'} sx={{ p: 2, flex: '0 1 auto', minWidth: 0 }}>
            <Stack gap={1}>
              <Stack direction={'row'} gap={2} rowGap={1.5} flexWrap={'wrap'} alignItems={'flex-end'}>
                <FormControl size={'small'} variant="standard" sx={{ minWidth: 160 }}>
                  <InputLabel id="optimize-stat-label">Optimize for</InputLabel>
                  <Select
                    labelId="optimize-stat-label"
                    id="optimize-stat"
                    value={stat}
                    disabled={running}
                    onChange={(e) => handleStatChange(e.target.value)}
                  >
                    <MenuItem value={'totalBuildRate'}>Build speed</MenuItem>
                    <MenuItem value={'totalPlayerExpRate'}>Player XP rate</MenuItem>
                    <MenuItem value={WEIGHTED_STAT}>Balanced (weighted)</MenuItem>
                  </Select>
                </FormControl>
                {stat === WEIGHTED_STAT ? [
                  ['totalBuildRate', 'Build'],
                  ['totalPlayerExpRate', 'Player XP'],
                  ['totalFlaggyRate', 'Flaggy']
                ].map(([key, label]) => <TextField key={key}
                                                   onChange={({ target }) => handleWeightChange(key, target.value)}
                                                   type={'number'}
                                                   disabled={running}
                                                   inputProps={{ min: 0, step: 0.5 }}
                                                   variant={'standard'}
                                                   size={'small'}
                                                   sx={{ width: 76 }}
                                                   label={label}
                                                   value={weights[key]}/>) : null}
                {totalCharacters > 0 ? <Tooltip followCursor={false}
                                                title={'Characters on the board stop making cogs, so the optimizer only uses this many.'}>
                  {/* No helperText - it adds a line under the input, which drops this field out of
                      line with everything else on the flex-end row. */}
                  <TextField onChange={({ target }) => setMaxCharacters(target.value)}
                             type={'number'}
                             disabled={running}
                             inputProps={{ min: 0, max: totalCharacters, step: 1 }}
                             variant={'standard'}
                             size={'small'}
                             sx={{ width: 90 }}
                             label={`Max chars (${totalCharacters})`}
                             value={maxCharacters}/>
                </Tooltip> : null}
                <Stack gap={0.5}>
                  <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>Effort</Typography>
                  <ToggleButtonGroup size={'small'} exclusive value={computeSeconds} disabled={running}
                                     onChange={(e, value) => (value ? setComputeSeconds(value) : null)}>
                    {COMPUTE_PRESETS.map(({ label, seconds }) => <ToggleButton key={label} value={seconds}
                                                                              sx={{ textTransform: 'unset', py: 0.25 }}>
                      {label}
                    </ToggleButton>)}
                  </ToggleButtonGroup>
                </Stack>
                {running
                  ? <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <CircularProgress size={16}/>
                    <Typography variant={'caption'} sx={{ color: 'text.secondary' }}>
                      {gain > 0 ? `+${(gain * 100).toFixed(1)}% so far` : 'Searching…'}
                    </Typography>
                    <Button size={'small'} color={'inherit'} sx={{ textTransform: 'unset' }}
                            onClick={cancel}>Cancel</Button>
                  </Stack>
                  : <Stack direction={'row'} gap={1}>
                    <Button variant={'contained'} onClick={handleOptimize}>Optimize</Button>
                    {optimized
                      ? <Button color={'inherit'} sx={{ textTransform: 'unset' }}
                                onClick={() => { reset(); setCursor(0); }}>Clear</Button>
                      : null}
                  </Stack>}
              </Stack>
              {running ? <LinearProgress variant={'determinate'} value={progress * 100}
                                         sx={{ height: 6, borderRadius: 3 }}/> : null}
              {error ? <Typography variant={'caption'} sx={{ color: 'error.main' }}>{error}</Typography> : null}
            </Stack>
          </Paper>
          {/* Basis, not zero: the stats have to keep at least two columns, or the grid drops to one,
              the card grows four rows tall and the controls beside it stretch to match. The controls
              wrap instead - they are a row of small fields and lose nothing by it. */}
          <Paper variant={'outlined'} sx={{ p: 2, flex: '1 1 340px', minWidth: { xs: 0, md: 340 } }}>
            <ConstructionStats construction={state?.account?.construction} optimized={optimized}/>
          </Paper>
        </Stack>
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
              top: `${STICKY_TOP}px`
            }
          }}>
            <ConstructionBoard view={view} showTooltip={showTooltip}
                               roundedValues={roundedValues}
                               markSpares={!!optimized}
                               dimUnchanged={cursor > 0}
                               highlightSlots={highlightSlots}
                               board={shownBoard}
                               leftColumn={state?.account?.construction?.leftColumn}
                               rightColumn={state?.account?.construction?.rightColumn}/>
            {/* Only the legend lives under the board - Back and Next moved into the steps panel,
                which is always on screen. */}
            {moves?.length > 0 ? <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
              <LegendItem color={'#ffb300'} label={'Slots of the step you are on'}/>
              <LegendItem color={'#66bb6a'} label={'Pulled from cog inventory'}/>
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
              top: `${STICKY_TOP}px`,
              maxHeight: panelHeight ? `${panelHeight}px` : `calc(100vh - ${STICKY_TOP + 16}px)`
            }
          }}>
            {optimized
              ? <ConstructionMoves moves={moves} cursor={cursor} onCursorChange={setCursor}
                                   onHover={setHoverHighlight}/>
              : <Stack gap={1} sx={{ alignSelf: 'center', mx: 'auto', textAlign: 'center', py: 4 }}>
                <Typography variant={'h6'}>Steps to apply</Typography>
                <Typography variant={'body2'} sx={{ color: 'text.secondary', maxWidth: 320 }}>
                  Hit Optimize and the swaps to get there show up here, one at a time, with the board
                  beside them following along.
                </Typography>
              </Stack>}
          </Paper>
        </Box>
        {state?.account?.construction?.smallCogs?.spares?.length > 0
          ? <Paper variant={'outlined'} sx={{ p: 2 }}>
            <ConstructionSmallCogs smallCogs={state?.account?.construction?.smallCogs}/>
          </Paper>
          : null}
      </Stack>
      <Snackbar open={!!copied} autoHideDuration={2500} message={copied} onClose={() => setCopied('')}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}/>
    </>
  );
}

export default ConstructionMain;

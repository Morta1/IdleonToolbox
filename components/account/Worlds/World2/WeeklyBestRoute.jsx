import { useEffect, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { IconCopy } from '@tabler/icons-react';
import { format, isValid } from 'date-fns';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { getTaskQuantity, getWeeklyBoss } from '@parsers/world-2/weeklyBosses';
import {
  getFightActionText,
  getFightActionType,
  getFightPows,
  getRouteCode,
  searchFightRoutes
} from '@parsers/world-2/weeklyBossFight';
import { getBestActiveCharacter } from '@parsers/talents';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';
import Notice from '@components/common/Notice';
import CardGrid from '@components/common/cards/CardGrid';
import { cardState, cardSurface } from '@components/common/cards/tokens';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import SimpleLoader from '@components/common/SimpleLoader';
import GameIcon from '@components/common/GameIcon';
import { notify } from '@components/common/Overlays/notify';
import { NoteTrigger } from '@components/common/InfoButton';
import { TROPHY_ICON } from './WeeklyBoss';

// A search slice's budget, well under the 50 ms the browser counts as a long task
const SLICE_MS = 8;
// Each save's search, kept while the save is: it doesn't change until a new upload
const SEARCHED = new WeakMap();

export const ROUTE_GOALS = [['skulls', 'Most skulls'], ['exp', 'Class EXP'], ['dmg', 'Damage'], ['trophies', 'Trophies']];
const POSITIONS = ['Top', 'Middle', 'Bottom'];
const MAX_SKULLS = 5;
const SKULL_ICON = 'etc/WeeklyBossSkull.png';
const SKULL_EMPTY_ICON = 'etc/WeeklyBossSkullEmpty.png';
// The glyphs are cream (beaten) and near-black (to beat): a 1 px ring in the page's quiet ink keeps both on either scheme
const SKULL_RING = 'var(--mui-palette-text-secondary)';
const SKULL_SX = {
  display: 'inline-flex',
  filter: `drop-shadow(1px 0 0 ${SKULL_RING}) drop-shadow(-1px 0 0 ${SKULL_RING}) drop-shadow(0 1px 0 ${SKULL_RING}) drop-shadow(0 -1px 0 ${SKULL_RING})`
};
// On a light page the near-black glyph is the heaviest thing in the row: faded and unringed (a ring stacks four
// shadows, which turned the faded glyph solid again), the beaten cream skulls lead
const EMPTY_SKULL_SX = (theme) => ({ ...SKULL_SX, ...theme.applyStyles('light', { opacity: 0.4, filter: 'none' }) });
const ROUTE_TOOLBAR = { view: 'table' };
const ROUTE_LEGEND = 'One number per click, left to right: 1 is the top option, 2 the middle, 3 the bottom. (FR) sends play back to the first character, (R) lets the previous character go again, (+1) gives the last character an extra turn.';
// A pick tile's least width: "Full rewind: " and a ten-letter name on two lines
const PICK_TILE_MIN = 124;

// The three options as the fight stacks them, the one to click lit
const PickBars = ({ option }) => <Stack role={'img'} aria-label={`${POSITIONS[option]} option`} gap={'3px'}>
  {POSITIONS.map((position, index) => <Box key={position} sx={{
    width: 18, height: 5, borderRadius: '2px', bgcolor: index === option ? 'primary.main' : 'divider'
  }}/>)}
</Stack>;

const shortNote = (step, names) => {
  if (step.rewind === 'full') return `Full rewind: ${names[0]} next`;
  if (step.rewind === 'back') return `Rewind: ${names[Math.max(0, step.turn - 1)]} again`;
  if (step.rewind === 'joke') return 'Extra turn';
  return null;
};

const rewindNote = (step, names) => {
  if (step.rewind === 'full') return `Full rewind: ${names[0]} goes next.`;
  if (step.rewind === 'back') return `Rewind: ${names[Math.max(0, step.turn - 1)]} goes again.`;
  if (step.rewind === 'joke') return `Extra turn: ${names[step.turn]} picks again.`;
  return null;
};

// One row per click (or skip), each pass after a full rewind under its own band
const routeRows = (route, week, names, quantities, pows) => {
  let pass = 1;
  let click = 0;
  return route.steps.map((step, index) => {
    if (index > 0 && route.steps[index - 1].rewind === 'full') pass += 1;
    const task = week.triplets[step.turn]?.task;
    const taskText = cleanUnderscore(task?.statText?.replace('{', formatNum(Math.round(quantities[step.turn] ?? 0), 'whole')));
    const row = {
      key: index, pass, turn: step.turn, name: names[step.turn], taskIcon: `etc/Req_Icon_${task?.rawName}.png`,
      taskText: `${taskText} · ${formatNum((pows[step.turn] ?? 0) * 100, 'pct')} strength`, skip: Boolean(step.skip)
    };
    if (step.skip) return row;
    click += 1;
    return {
      ...row, click, option: step.option, type: getFightActionType(step.action),
      text: cleanUnderscore(getFightActionText(step.action, formatNum(step.value, 'whole'))),
      note: rewindNote(step, names), shortNote: shortNote(step, names), skull: step.skull
    };
  });
};

const COLUMNS = [
  {
    key: 'name', label: 'Character', icon: (row) => <GameIcon src={row.taskIcon} size={24} alt={''}/>,
    render: (row) => <Stack gap={0.25}>
      <Typography variant={'body2'} fontWeight={500}>{row.name}</Typography>
      <Typography variant={'caption'} color={'text.secondary'}>{row.taskText}</Typography>
    </Stack>
  },
  {
    key: 'pick', label: 'Pick', phone: true, render: (row) => <Stack direction={'row'} alignItems={'center'} gap={1}>
      <Typography variant={'value'} color={'primary.main'} sx={{ minWidth: 10 }}>{row.option + 1}</Typography>
      <PickBars option={row.option}/>
    </Stack>
  },
  {
    key: 'action', label: 'What it does', from: 'sm', render: (row) => <Stack gap={0.25} sx={{ maxWidth: 560 }}>
      <Typography variant={'groupLabel'} color={`identity.weeklyAction.${row.type}`}>{row.type}</Typography>
      <Typography variant={'body2'}>{row.text}</Typography>
      {row.note ? <Typography variant={'body2'} color={'primary.main'} fontWeight={500}>{row.note}</Typography> : null}
    </Stack>
  },
  {
    // The fight screen's own five skulls filling up (font 315's "|" beaten, "`" still to beat), so a skull falling
    // shows down the column at a glance
    key: 'skull', label: 'Skulls', from: 'md', detailLabel: 'Skulls', render: (row) => <Stack direction={'row'} gap={0.25}
                                                                                           role={'img'} aria-label={`${row.skull} of ${MAX_SKULLS} skulls`}>
      {Array.from({ length: MAX_SKULLS }, (_, index) => (index < row.skull
        ? <Box key={index} component={'span'} sx={SKULL_SX}><GameIcon size={16} alt={''} src={SKULL_ICON}/></Box>
        : <Box key={index} component={'span'} sx={EMPTY_SKULL_SX}><GameIcon size={16} alt={''} src={SKULL_EMPTY_ICON}/></Box>))}
    </Stack>
  }
];

const passLabel = (pass) => (pass === 1 ? 'First pass' : `Pass ${pass}: after a full rewind`);
const passBand = (row) => ({ key: row.pass, label: passLabel(row.pass) });

// One click as a tile, read left to right while playing: the number to press and the bars where it sits
const pickTile = (row) => <Box key={row.key} role={'listitem'} sx={[
  (theme) => cardSurface(theme),
  (theme) => cardState(theme, row.skip ? 'dim' : undefined),
  { p: 1, display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }
]}>
  <Stack direction={'row'} justifyContent={'space-between'} alignItems={'baseline'} gap={0.5}>
    <Typography variant={'caption'} color={'text.secondary'} sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {row.skip ? 'Skip' : `#${row.click}`}
    </Typography>
    {row.skip ? null : <Typography variant={'groupLabel'} color={`identity.weeklyAction.${row.type}`}>{row.type}</Typography>}
  </Stack>
  <Stack direction={'row'} alignItems={'center'} gap={1}>
    <GameIcon src={row.taskIcon} size={28} alt={''}/>
    {row.skip ? null : <>
      <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }} color={'primary.main'}
                  aria-label={`Pick ${row.option + 1}`}>{row.option + 1}</Typography>
      <PickBars option={row.option}/>
    </>}
  </Stack>
  <Typography variant={'body2'} fontWeight={500} noWrap>{row.name}</Typography>
  {row.shortNote ? <Typography variant={'caption'} color={'primary.main'} fontWeight={500}>{row.shortNote}</Typography> : null}
</Box>;

const PicksView = ({ rows }) => {
  const passes = [...new Set(rows.map(({ pass }) => pass))];
  return <Stack gap={3}>
    {passes.map((pass) => {
      const passRows = rows.filter((row) => row.pass === pass);
      const clicks = passRows.filter(({ skip }) => !skip).length;
      return <Stack key={pass} gap={1}>
        <Stack direction={'row'} justifyContent={'space-between'} alignItems={'baseline'} gap={1} flexWrap={'wrap'}>
          <Typography variant={'groupLabel'} color={'text.secondary'}>{passLabel(pass)}</Typography>
          <Typography variant={'body2'} color={'text.secondary'}>{`${formatNum(clicks, 'whole')} clicks`}</Typography>
        </Stack>
        <CardGrid size={'icon'} fill={PICK_TILE_MIN} role={'list'} aria-label={passLabel(pass)}>{passRows.map(pickTile)}</CardGrid>
      </Stack>;
    })}
  </Stack>;
};

// This week's fight played out for a goal: the clicks that reach it, with the characters' own strength
const WeeklyBestRoute = ({ account, characters, goal }) => {
  const [result, setResult] = useState(null);
  const [view, setView, resetView] = useToolbarState('weekly-boss-route', ROUTE_TOOLBAR);
  useEffect(() => {
    const cached = SEARCHED.get(account);
    if (cached) {
      const timer = setTimeout(() => setResult(cached), 0);
      return () => clearTimeout(timer);
    }
    const [week] = getWeeklyBoss(account, 1);
    const search = week ? searchFightRoutes(week, account, characters) : null;
    // The search is most of a second of work: run in slices, handing the browser back between them so the page
    // never freezes, and kept per save so opening the tab again shows it at once. A message channel, not a timer:
    // nested timers wait 4 ms each, a third more time on top of the slices.
    const channel = new MessageChannel();
    let cancelled = false;
    const slice = () => {
      if (cancelled) return;
      const until = performance.now() + SLICE_MS;
      let next = search?.next() ?? { done: true, value: null };
      while (!next.done && performance.now() < until) next = search.next();
      if (!next.done) {
        channel.port2.postMessage(null);
        return;
      }
      const routes = next.value;
      const loggedIn = getBestActiveCharacter(characters);
      const found = routes ? {
        account, week, routes, pows: getFightPows(week, account, characters),
        quantities: (characters ?? []).map((_, turn) => getTaskQuantity(turn, week.triplets[turn]?.task?.taskIndex, account, characters, loggedIn))
      } : { account, routes: null };
      SEARCHED.set(account, found);
      setResult(found);
    };
    channel.port1.onmessage = slice;
    channel.port2.postMessage(null);
    return () => {
      cancelled = true;
      channel.port1.close();
    };
  }, [account, characters]);

  // A result for another save (a new upload) is stale until its own search ends
  if (result?.account !== account) return <SimpleLoader message={'Solving the fight...'}/>;
  if (!result.routes) return <Notice tone={'missing'}>This week&apos;s fight couldn&apos;t be worked out from this save.</Notice>;

  const { week, routes, pows, quantities } = result;
  const route = routes[goal] ?? routes.skulls;
  const names = (characters ?? []).map(({ name }) => cleanUnderscore(name));
  const code = getRouteCode(route);
  const codes = ROUTE_GOALS.map(([id]) => getRouteCode(routes[id]).join('\n'));
  const sameForEveryGoal = codes.every((text) => text === codes[0]);
  const rows = routeRows(route, week, names, quantities, pows);

  const copyRoute = async () => {
    try {
      await navigator.clipboard.writeText(code.join('\n'));
      notify('Route copied');
    } catch {
      notify('Couldn\'t copy the route');
    }
  };

  return <Stack gap={2}>
    <Stack direction={'row'} flexWrap={'wrap'} alignItems={'flex-start'} gap={1.5}>
      <StatTile label={isValid(week.date) ? `This week, from ${format(week.date, 'MMM d')}` : 'This week'}
                icon={`etc/${week.bossName}.png`} value={cleanUnderscore(week.bossName)}/>
      <StatTile label={'Skulls'} value={`${route.skulls} of 5`}/>
      <StatTile label={'Bonus Class EXP'} value={formatNum(route.exp, 'pct', { signed: true })}/>
      <StatTile label={'Bonus damage'} value={formatNum(route.dmg, 'pct', { signed: true })}/>
      <StatTile label={'Trophies'} icon={TROPHY_ICON} value={formatNum(route.trophies, 'whole')}
                info={`From each skull tier the first time it falls this week, and ${formatNum(route.pickups, 'whole')} picked up in the fight. Counts a fight not started yet: a tier already beaten this week drops none again.`}/>
      <StatTile label={'Clicks'} value={formatNum(route.clicks, 'whole')}/>
      {/* The route as numbers, one line per pass: a summary of the clicks below, to copy into a note */}
      <StatTile label={'Route'} info={ROUTE_LEGEND}>
        {/* Kept behind a tap: the clicks below already say it, the line is for copying into a note */}
        <Stack direction={'row'} alignItems={'center'} gap={0.5}>
          <NoteTrigger underTile maxWidth={560} label={'Route'} note={<Box>
            {code.map((line, index) => <Typography key={index} variant={'body2'} component={'div'}
                                                   sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{line}</Typography>)}
          </Box>}>
            <Typography component={'span'} variant={'value'}
                        sx={{ textDecoration: 'underline dotted', textUnderlineOffset: 3, cursor: 'help' }}>Show</Typography>
          </NoteTrigger>
          <IconButton size={'small'} aria-label={'Copy route'} onClick={copyRoute}><IconCopy size={18}/></IconButton>
        </Stack>
      </StatTile>
    </Stack>
    {sameForEveryGoal ? <Notice tone={'info'}>
      This week every goal picks the same route for your characters.
    </Notice> : null}
    <Box>
      <Toolbar state={view} defaults={ROUTE_TOOLBAR} onChange={setView} onReset={resetView}>
        <Toolbar.View options={[['table', 'Table'], ['picks', 'Picks']]}/>
      </Toolbar>
      {view?.view === 'picks' ? <PicksView rows={rows}/>
        : <DataTable columns={COLUMNS} rows={rows} rowKey={'key'} bands={passBand} bandNoun={'clicks'}
                     rankOf={(row) => (row.skip ? '' : row.click)} mutedWord={(row) => (row.skip ? 'Skip' : null)}
                     rowLabel={(row) => (row.skip ? `${row.name}: skip` : `Click ${row.click}`)}/>}
    </Box>
  </Stack>;
};

export default WeeklyBestRoute;

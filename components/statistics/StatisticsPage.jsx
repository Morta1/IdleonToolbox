import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { Box, LinearProgress, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SimpleLoader from '@components/common/SimpleLoader';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { LinkMark } from '@components/common/cards/ItemCard';
import ErrorBoundary from '@components/common/ErrorBoundary';
import Notice, { retryAction } from '@components/common/Notice';
import Toolbar, { FilterPill } from '@components/common/Toolbar';
import GameIcon from '@components/common/GameIcon';
import { formatNum } from '@utility/helpers';
import { classToSlug } from '@utility/builds/class-paths.mjs';
import { classes } from '@website-data';
import StatisticsChart, { chartRows } from './StatisticsChart';
import { BANDS, chartsFor, classIcon, className, counted, inBand, parseBand } from './charts';

const API_URL = process.env.NEXT_PUBLIC_PROFILES_URL;
const REQUEST_TIMEOUT = 20000;

// Two panels share a row's height: the spare goes down to the chart frame, whose footer closes the panel.
const COLUMN_SX = { display: 'flex', flexDirection: 'column' };
const CHART_PANEL_SX = { ...COLUMN_SX, height: '100%', boxSizing: 'border-box', '& > :last-child': { ...COLUMN_SX, flexGrow: 1 } };
const LABEL_SX = { fontSize: 12, lineHeight: '16px', color: 'text.secondary' };

const fetchStatistics = (classKey) => fetch(`${API_URL}/statistics?class=${classKey}`, { signal: AbortSignal.timeout?.(REQUEST_TIMEOUT) })
  .then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.status === 204 ? null : res.json();
  });

const pct = (value) => formatNum(value, 'pct', { decimals: 1 });

// A control's name above it, as the board draws the class and band controls
const Labeled = ({ id, label, children }) => <Stack gap={0.75}>
  <Typography id={id} component={'span'} sx={LABEL_SX}>{label}</Typography>
  {children}
</Stack>;

// Pick one class, or All classes: each row its sprite, name and share of the characters counted
const ClassPicker = ({ classId, options, total, onPick, fullWidth }) => <TextField
  select
  value={classId ?? 'all'}
  onChange={(event) => onPick(event.target.value === 'all' ? null : Number(event.target.value))}
  sx={{ minWidth: { sm: 260 }, ...(fullWidth ? { width: '100%' } : {}) }}
  slotProps={{
    select: {
      SelectDisplayProps: { 'aria-labelledby': 'statistics-class-label' },
      // The field shows the pick's sprite and name; the share sits in the list
      renderValue: (value) => <Stack direction={'row'} alignItems={'center'} gap={1.25}>
        {value !== 'all' ? <GameIcon src={classIcon(value)} size={24} alt={''}/> : null}
        <span>{value === 'all' ? 'All classes' : className(value)}</span>
      </Stack>
    }
  }}
>
  <MenuItem value={'all'} sx={{ gap: 1.25 }}>
    <Box component={'span'} sx={{ flex: 1 }}>All classes</Box>
    <Box component={'span'} sx={LABEL_SX}>{formatNum(total)} characters</Box>
  </MenuItem>
  {options.map(({ id, share }) => <MenuItem key={id} value={id} sx={{ gap: 1.25 }}>
    <GameIcon src={classIcon(id)} size={24} alt={''}/>
    <Box component={'span'} sx={{ flex: 1 }}>{className(id)}</Box>
    <Box component={'span'} sx={LABEL_SX}>{pct(share)}</Box>
  </MenuItem>)}
</TextField>;

// The band: pills from sm, a field on a phone, CSS picking one so the export matches every width
const BandPicker = ({ band, playersByBand, onPick }) => <>
  <Stack direction={'row'} gap={1} flexWrap={'wrap'} role={'group'} aria-labelledby={'statistics-band-label'}
         sx={{ display: { xs: 'none', sm: 'flex' } }}>
    {BANDS.map(({ id, label }) => <FilterPill key={id} value={id} on={band === id} onToggle={() => onPick(band === id ? null : id)}
                                              label={`${label} (${formatNum(playersByBand[id] ?? 0)})`}/>)}
  </Stack>
  <TextField select value={band ?? 'all'} onChange={(event) => onPick(event.target.value === 'all' ? null : Number(event.target.value))}
             sx={{ display: { xs: 'flex', sm: 'none' }, width: '100%' }}
             slotProps={{ select: { SelectDisplayProps: { 'aria-labelledby': 'statistics-band-label' } } }}>
    <MenuItem value={'all'}>All players</MenuItem>
    {BANDS.map(({ id, label }) => <MenuItem key={id} value={id}>{label} ({formatNum(playersByBand[id] ?? 0)})</MenuItem>)}
  </TextField>
</>;

// Every payload this visit has loaded, by class key: going back to a class, or Back and Forward, shows it at once.
const loaded = new Map();
// A class switch that answers within this keeps the page as it is; past it the old charts dim under a progress bar.
const DIM_AFTER = 100;

// /statistics and /statistics/<class>, one component for both routes: every chart re-counts for a total level band (?band=)
// and, with a class picked, for that class's characters. classId: the route's class, from static props. Picking a class
// re-renders this page with the new props, so the toolbar stays and the old charts stay in place, dimmed, until the new
// class's numbers arrive: only the first visit shows a loader.
const StatisticsPage = ({ classId = null }) => {
  const router = useRouter();
  // The band is in the URL's query, which is empty until the router is ready
  const band = router.isReady ? parseBand(router.query.band) : null;
  const classKey = classId == null ? 'all' : String(classId);
  // What is on screen: the payload of `key`, which trails classKey while a new class loads
  const [shown, setShown] = useState({ key: null, data: null });
  const [failure, setFailure] = useState({ key: null, count: 0 });
  const [attempt, setAttempt] = useState(0);
  const [retrying, setRetrying] = useState(false);
  // The class whose load has run past DIM_AFTER
  const [slowKey, setSlowKey] = useState(null);
  const cached = loaded.get(classKey);
  const current = cached ? { key: classKey, data: cached } : shown;
  const failed = failure.key === classKey ? failure.count : 0;

  useEffect(() => {
    if (loaded.has(classKey)) return undefined;
    // A pick the player has moved on from never replaces the newer one when it answers late
    let active = true;
    const timer = setTimeout(() => setSlowKey(classKey), DIM_AFTER);
    fetchStatistics(classKey)
      .then((data) => {
        loaded.set(classKey, data);
        if (active) setShown({ key: classKey, data });
      })
      .catch(() => {
        if (active) setFailure((previous) => ({ key: classKey, count: previous.count + 1 }));
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setRetrying(false);
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [classKey, attempt]);

  const query = (nextBand) => (nextBand ? { band: nextBand } : {});
  const pickClass = (id) => router.push({ pathname: id == null ? '/statistics' : `/statistics/${classToSlug(classes?.[id])}`, query: query(band) },
    undefined, { scroll: false });
  const pickBand = (id) => router.replace({ pathname: router.asPath.split('?')[0], query: query(id) }, undefined, { shallow: true, scroll: false });

  const { data } = current;
  const busy = current.key !== classKey && !failed;
  const dim = busy && slowKey === classKey;
  // The header and the picker follow the route at once; the numbers below follow what has loaded
  const header = <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mb: 2 }}>
    <GameIcon src={classId != null ? classIcon(classId) : 'etc/World_Category.png'} size={40} alt={''}/>
    <Typography variant={'pageTitle'} component={'h1'}>{classId != null ? `${className(classId)} statistics` : 'Statistics'}</Typography>
  </Stack>;
  const failNotice = failed ? <Notice key={failed} tone={'error'} action={retryAction(() => {
    setRetrying(true);
    setAttempt((count) => count + 1);
  }, retrying)}>Couldn't load the statistics.</Notice> : null;

  if (!data) {
    return <>{header}{failNotice ?? (current.key ? <Notice tone={'info'}>No statistics yet.</Notice> : <SimpleLoader message={'Loading statistics...'}/>)}</>;
  }

  const shownClass = current.key === 'all' ? null : Number(current.key);
  const name = shownClass != null ? className(shownClass) : null;
  const all = counted(data, band, null);
  const picked = counted(data, band, shownClass);
  const playersByBand = Object.fromEntries(BANDS.map(({ id }) => [id, counted(data, id, null).players]));
  const classOptions = Object.entries(Object.groupBy(inBand(data.classes, band), (row) => row.c))
    .map(([id, rows]) => ({ id: Number(id), n: rows.reduce((sum, row) => sum + row.n, 0) }))
    .filter(({ id }) => classes?.[id])
    .map((option) => ({ ...option, share: all.characters ? (option.n / all.characters) * 100 : 0 }))
    .toSorted((a, b) => b.n - a.n);
  const bandScope = band ? BANDS.find(({ id }) => id === band).scope : null;
  const playersText = `${formatNum(all.players)} players${bandScope ? ` ${bandScope}` : ''}`;
  const scope = shownClass != null
    ? <>Showing <b>{formatNum(picked.characters)} {name} characters</b> of the {playersText}</>
    : <>Showing <b>{bandScope ? `the ${playersText}` : `all ${playersText}`}</b></>;
  // Every count a chart's shares can be of: characters, players, or the players who placed a kind of doubler
  const perOf = { ...all, characters: picked.characters, allCharacters: all.characters };
  const charts = chartsFor(data, band, shownClass)
    .map((entry) => ({ ...entry, title: entry.title ?? entry.chart.title, rows: chartRows(entry.chart, entry.raw, perOf[entry.chart.per]) }))
    .filter(({ rows }) => rows.length);

  return <>
    {header}
    <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 2 }}>
      {classId != null
        ? `What players use on this class, from the profiles uploaded to Idleon Toolbox, refreshed every 3 hours.`
        : 'Counted from every profile players have uploaded to Idleon Toolbox, refreshed every 3 hours.'}
    </Typography>
    <Toolbar counted={false}>
      <Toolbar.Lead ownRow>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Labeled id={'statistics-class-label'} label={'Class'}>
            <ClassPicker classId={classId} options={classOptions} total={all.characters} onPick={pickClass} fullWidth/>
          </Labeled>
        </Box>
      </Toolbar.Lead>
      <Toolbar.Lead ownRow>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Labeled id={'statistics-band-label'} label={'Total level'}>
            <BandPicker band={band} playersByBand={playersByBand} onPick={pickBand}/>
          </Labeled>
        </Box>
      </Toolbar.Lead>
    </Toolbar>
    {/* The bar's room is kept while nothing loads, so nothing below moves when it shows */}
    <Box sx={{ height: 4 }}>{dim ? <LinearProgress aria-label={'Loading statistics'}/> : null}</Box>
    {failNotice ? <Box sx={{ mt: 1 }}>{failNotice}</Box> : null}
    <Box aria-busy={busy} sx={{ transition: 'opacity 150ms', ...(dim ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}>
    <Typography aria-live={'polite'} sx={{ mt: 1.5, mb: 2 }}>{scope}</Typography>
    {shownClass != null ? <PageSummary>
      <StatTile label={'Share of characters'} value={all.characters ? pct((picked.characters / all.characters) * 100) : '-'}/>
      <StatTile label={'Characters counted'} value={formatNum(picked.characters)}/>
      <StatTile label={'Median level'} value={picked.medianLevel != null ? formatNum(Math.round(picked.medianLevel)) : '-'}/>
      <StatTile label={'Builds'} value={<Link component={NextLink} href={`/tools/builds/${classToSlug(classes?.[shownClass])}`} underline={'hover'}>
        {name} builds <LinkMark/>
      </Link>}/>
    </PageSummary> : null}
    {picked.tooFew || (shownClass != null && !picked.characters)
      ? <Box sx={{ mb: 2 }}><Notice tone={'info'}>Too few {name} characters in this level band to show their choices.</Notice></Box>
      : null}
    {charts.length ?<CardGrid size={'l'} sx={{ gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width:1300px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } }}>
      {charts.map(({ key, chart, title, rows }) => <Panel key={key} title={title}
                                                           meta={`${chart.subtitle ? `${chart.subtitle} · ` : ''}${formatNum(perOf[chart.per] ?? 0)} ${/haracters$/.test(chart.per) ? 'characters' : 'players'} counted`}
                                                           sx={CHART_PANEL_SX}>
        <Box sx={{ ...COLUMN_SX, flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
          <ErrorBoundary title={'This chart didn\'t load'}><StatisticsChart config={chart} title={title} rows={rows}/></ErrorBoundary>
        </Box>
      </Panel>)}
    </CardGrid> : null}
    </Box>
  </>;
};

export default StatisticsPage;

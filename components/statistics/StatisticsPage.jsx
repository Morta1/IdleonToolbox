import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { Box, Link, MenuItem, Stack, TextField, Typography } from '@mui/material';
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

// /statistics and /statistics/<class>: every chart re-counts for a total level band (?band=) and, with a class picked,
// for that class's characters. classId: the route's class, from static props, so the export already holds it.
const StatisticsPage = ({ classId = null }) => {
  const router = useRouter();
  // The band is in the URL's query, which is empty until the router is ready
  const band = router.isReady ? parseBand(router.query.band) : null;
  const classKey = classId ?? 'all';
  const [state, setState] = useState({ key: null, data: null, failed: 0 });
  const [retrying, setRetrying] = useState(false);

  const load = () => fetchStatistics(classKey)
    .then((data) => setState({ key: classKey, data, failed: 0 }))
    .catch(() => setState((previous) => ({ ...previous, key: classKey, failed: previous.failed + 1 })))
    .finally(() => setRetrying(false));

  useEffect(() => {
    load();
  }, [classKey]);

  const query = (nextBand) => (nextBand ? { band: nextBand } : {});
  const pickClass = (id) => router.push({ pathname: id == null ? '/statistics' : `/statistics/${classToSlug(classes?.[id])}`, query: query(band) });
  const pickBand = (id) => router.replace({ pathname: router.asPath.split('?')[0], query: query(id) }, undefined, { shallow: true, scroll: false });

  const loading = state.key !== classKey;
  const { data, failed } = state;
  const name = classId != null ? className(classId) : null;

  const header = classId != null ? <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mb: 2 }}>
    <GameIcon src={classIcon(classId)} size={56} alt={''}/>
    <Typography variant={'pageTitle'} component={'h1'}>{name} statistics</Typography>
  </Stack> : null;

  if (loading) return <>{header}<SimpleLoader message={'Loading statistics...'}/></>;
  if (failed || !data) {
    return <>{header}{failed ? <Notice key={failed} tone={'error'} action={retryAction(() => {
      setRetrying(true);
      load();
    }, retrying)}>Couldn't load the statistics.</Notice> : <Notice tone={'info'}>No statistics yet.</Notice>}</>;
  }

  const all = counted(data, band, null);
  const picked = counted(data, band, classId);
  const playersByBand = Object.fromEntries(BANDS.map(({ id }) => [id, counted(data, id, null).players]));
  const classOptions = Object.entries(Object.groupBy(inBand(data.classes, band), (row) => row.c))
    .map(([id, rows]) => ({ id: Number(id), n: rows.reduce((sum, row) => sum + row.n, 0) }))
    .filter(({ id }) => classes?.[id])
    .map((option) => ({ ...option, share: all.characters ? (option.n / all.characters) * 100 : 0 }))
    .toSorted((a, b) => b.n - a.n);
  const bandScope = band ? BANDS.find(({ id }) => id === band).scope : null;
  const playersText = `${formatNum(all.players)} players${bandScope ? ` ${bandScope}` : ''}`;
  const scope = classId != null
    ? <>Showing <b>{formatNum(picked.characters)} {name} characters</b> of the {playersText}</>
    : <>Showing <b>{bandScope ? `the ${playersText}` : `all ${playersText}`}</b></>;
  const perOf = { characters: picked.characters, allCharacters: all.characters, players: all.players, starPlayers: all.starPlayers };
  const charts = chartsFor(data, band, classId)
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
    <Typography aria-live={'polite'} sx={{ my: 2 }}>{scope}</Typography>
    {classId != null ? <PageSummary>
      <StatTile label={'Share of characters'} value={all.characters ? pct((picked.characters / all.characters) * 100) : '-'}/>
      <StatTile label={'Characters counted'} value={formatNum(picked.characters)}/>
      <StatTile label={'Median level'} value={picked.medianLevel != null ? formatNum(Math.round(picked.medianLevel)) : '-'}/>
      <StatTile label={'Builds'} value={<Link component={NextLink} href={`/tools/builds/${classToSlug(classes?.[classId])}`} underline={'hover'}>
        {name} builds <LinkMark/>
      </Link>}/>
    </PageSummary> : null}
    {picked.tooFew || (classId != null && !picked.characters)
      ? <Notice tone={'info'}>Too few {name} characters in this level band to show their choices.</Notice>
      : null}
    {charts.length ? <CardGrid size={'l'} sx={{ gridTemplateColumns: 'minmax(0, 1fr)', '@media (min-width:1300px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } }}>
      {charts.map(({ key, chart, title, rows }) => <Panel key={key} title={title}
                                                           meta={`${chart.subtitle ? `${chart.subtitle} · ` : ''}${formatNum(perOf[chart.per] ?? 0)} ${/haracters$/.test(chart.per) ? 'characters' : 'players'} counted`}
                                                           sx={CHART_PANEL_SX}>
        <Box sx={{ ...COLUMN_SX, flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
          <ErrorBoundary title={'This chart didn\'t load'}><StatisticsChart config={chart} title={title} rows={rows}/></ErrorBoundary>
        </Box>
      </Panel>)}
    </CardGrid> : null}
  </>;
};

export default StatisticsPage;

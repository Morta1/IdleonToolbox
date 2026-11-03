import React, { useContext, useEffect, useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { fetchTomePercentiles } from '../../../../services/profiles';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { formatGame, tomeQuantity } from '@utility/gameNotation';
import NumberField from '@components/common/NumberField';
import SimpleLoader from '@components/common/SimpleLoader';
import useFormatDate from '@hooks/useFormatDate';
import DataTable from '@components/common/DataTable';
import StatusText from '@components/common/StatusText';
import usePageTop from '@hooks/usePageTop';
import StatTile from '@components/common/cards/StatTile';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { usePageSettings } from '@components/common/PageSettings';
import { CLASSIFICATION_TYPES, CLASSIFICATIONS_KEY, classificationsOf, withClassification } from './tomeClassifications';

const RANK_OPTIONS = [
  { label: 'All players', value: 'all' },
  ...['0.1%', '0.5%', '1%', '5%', '10%', '25%', '50%', '60%', '70%', '80%', '90%', '95%'].map((value) => ({ label: `Top ${value}`, value }))
];
const RANKINGS_TOOLBAR = { search: '', sort: { key: 'lowest', order: 'asc' }, view: 'none', hideMaxed: false };
// The comparison and the target change every percentile and gap on the tab: its settings row, remembered
const RANKINGS_SETTINGS = { rank: 'all', target: null };
const POINTS = 'Summoning.TomePTS';

function interpolatePercentile(value, boundaries, percentilePoints) {
  if (!boundaries?.length) return null;
  if (value >= boundaries[boundaries.length - 1]) return percentilePoints[percentilePoints.length - 1];
  if (value <= boundaries[0]) return percentilePoints[0];
  for (let i = 0; i < boundaries.length - 1; i++) {
    if (value >= boundaries[i] && value < boundaries[i + 1]) {
      const span = boundaries[i + 1] - boundaries[i];
      if (span === 0) return percentilePoints[i];
      const ratio = (value - boundaries[i]) / span;
      return percentilePoints[i] + ratio * (percentilePoints[i + 1] - percentilePoints[i]);
    }
  }
  return percentilePoints[percentilePoints.length - 1];
}

function interpolateValue(percentile, boundaries, percentilePoints) {
  if (!boundaries?.length) return null;
  if (percentile <= percentilePoints[0]) return boundaries[0];
  if (percentile >= percentilePoints[percentilePoints.length - 1]) return boundaries[boundaries.length - 1];
  for (let i = 0; i < percentilePoints.length - 1; i++) {
    if (percentile >= percentilePoints[i] && percentile < percentilePoints[i + 1]) {
      const span = percentilePoints[i + 1] - percentilePoints[i];
      if (span === 0) return boundaries[i];
      const ratio = (percentile - percentilePoints[i]) / span;
      return boundaries[i] + ratio * (boundaries[i + 1] - boundaries[i]);
    }
  }
  return boundaries[boundaries.length - 1];
}

// A percentile's tone: no data, below the 25th, the 25th to 75th, maxed, above the 75th. A word takes the text role,
// a bar or an edge the main shade (Foundations board).
function getPercentileTone(p, maxPercentile) {
  if (p == null) return 'muted';
  if (p < 25) return 'error';
  if (p < 75) return 'warning';
  if (p >= maxPercentile) return 'success';
  return 'info';
}

const toneText = (tone) => `text.${tone}`;
const toneFill = (tone) => (tone === 'muted' ? 'text.muted' : `${tone}.main`);

function calcQuantityForPoints({ x1, x2, x3, points }) {
  if (!x1 || x2 === undefined || !x3 || points <= 0) return null;
  const targetPercent = (points - 0.5) / x3;

  if (x2 === 2) return Math.ceil(targetPercent * x1);
  if (x2 === 4) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 2) return null;
    return Math.ceil((base * x1) / (2 - base));
  }
  if (x2 === 3) {
    const base = Math.pow(targetPercent, 1 / 5);
    if (base >= 1.2) return null;
    const qty = (1.2 * 6 * x1 - base * 7 * x1) / (1.2 - base);
    return Math.ceil(Math.max(0, qty));
  }
  if (x2 === 0) {
    const base = Math.pow(targetPercent, 1 / 0.7);
    if (base >= 1.7) return null;
    return Math.ceil((base * x1) / (1.7 - base));
  }
  if (x2 === 1) {
    const denom = 2 * targetPercent - 2.4;
    if (denom === 0) return null;
    const logQ = -(targetPercent * x1) / denom;
    if (logQ <= 0) return null;
    return Math.ceil(Math.pow(10, logQ));
  }
  return null;
}

function ordinal(n) {
  const r = n % 100;
  if (r > 10 && r < 14) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

const TomeRankings = () => {
  const { state } = useContext(AppContext);
  const [percentileData, setPercentileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('tome-rankings', RANKINGS_TOOLBAR);
  const [settings, setSettings] = usePageSettings('tome-rankings', RANKINGS_SETTINGS);
  const [toolbarBottom, setToolbarBottom] = useState(null);
  // Read after mount (the first render matches the export); no default, so a player who never edited stores nothing.
  const [storedClassifications, setStoredClassifications] = useLocalStorage({ key: CLASSIFICATIONS_KEY });
  const classifications = classificationsOf(storedClassifications);
  const pageTop = usePageTop();
  const formatDate = useFormatDate();

  useEffect(() => {
    fetchTomePercentiles()
      .then(data => {
        setPercentileData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <SimpleLoader message="Loading rankings data..." />;
  if (!percentileData) {
    return <Notice tone={'info'} sx={{ mt: 2 }}>Rankings aren&apos;t available yet: check back later.</Notice>;
  }

  const selectedRank = settings?.rank ?? 'all';
  const tome = state?.account?.tome?.tome || [];
  const hasUserData = tome.length > 0;
  const { percentilePoints, totalPlayers, playersByRank, rankThresholds } = percentileData;
  const gpNum = settings?.target;
  const targetSet = gpNum != null;

  const rows = tome.map((metric, index) => {
    const userPoints = metric.points;
    const bounds = selectedRank === 'all'
      ? percentileData.allPlayers?.[index]
      : percentileData.byRank?.[selectedRank]?.[index];
    const percentile = bounds
      ? interpolatePercentile(userPoints, bounds, percentilePoints)
      : null;
    let gap = null;
    if (targetSet && gpNum >= 1 && gpNum <= 100 && bounds) {
      const needed = interpolateValue(gpNum, bounds, percentilePoints);
      if (needed != null) gap = Math.round(needed) - userPoints;
    }

    return {
      name: cleanUnderscore(metric.name?.replace('(Tap_for_more_info)', '') || ''),
      userPoints,
      percentile,
      bounds,
      index,
      gap,
      quantity: metric.quantity,
      maxPoints: metric.maxPoints,
      x1: metric.x1,
      x2: metric.x2,
      x3: metric.x3,
      x4: metric.x4,
      classification: classifications[index]
    };
  });

  const sortMode = toolbar?.sort?.key ?? 'default';
  const needsTarget = sortMode === 'gap' || sortMode === 'highest_gap' || sortMode === 'efficiency';
  // A sort that needs a target falls back to the default order until one is set
  const effectiveSortMode = needsTarget && !targetSet ? 'default' : sortMode;
  let sorted;
  if (effectiveSortMode === 'lowest') {
    sorted = [...rows].sort((a, b) => (a.percentile ?? 101) - (b.percentile ?? 101));
  } else if (effectiveSortMode === 'gap') {
    sorted = [...rows].sort((a, b) => {
      const aBucket = a.gap == null ? 2 : a.gap <= 0 ? 0 : 1;
      const bBucket = b.gap == null ? 2 : b.gap <= 0 ? 0 : 1;
      if (aBucket !== bBucket) return aBucket - bBucket;
      if (aBucket === 1) return a.gap - b.gap;
      return 0;
    });
  } else if (effectiveSortMode === 'highest_gap') {
    sorted = [...rows].sort((a, b) => {
      const aBucket = a.gap == null ? 2 : a.gap <= 0 ? 1 : 0;
      const bBucket = b.gap == null ? 2 : b.gap <= 0 ? 1 : 0;
      if (aBucket !== bBucket) return aBucket - bBucket;
      if (aBucket === 0) return b.gap - a.gap;
      return 0;
    });
  } else if (effectiveSortMode === 'efficiency') {
    sorted = [...rows].sort((a, b) => {
      const aValid = a.gap != null && a.gap > 0 && a.percentile != null && gpNum > a.percentile;
      const bValid = b.gap != null && b.gap > 0 && b.percentile != null && gpNum > b.percentile;
      if (aValid !== bValid) return aValid ? -1 : 1;
      if (!aValid) return 0;
      const aEff = a.gap / (gpNum - a.percentile);
      const bEff = b.gap / (gpNum - b.percentile);
      return aEff - bEff;
    });
  } else {
    sorted = rows;
  }
  const ordered = toolbar?.sort?.order === 'desc' ? sorted.toReversed() : sorted;
  const maxPercentile = percentilePoints[percentilePoints.length - 1];
  const searchLower = String(toolbar?.search ?? '').trim().toLowerCase();
  const searched = searchLower ? ordered.filter(r => r.name.toLowerCase().includes(searchLower)) : ordered;
  const filtered = toolbar?.hideMaxed ? searched.filter(r => r.percentile == null || r.percentile < maxPercentile) : searched;

  const below25 = filtered.filter(r => r.percentile != null && r.percentile < 25).length;
  const between = filtered.filter(r => r.percentile != null && r.percentile >= 25 && r.percentile < 75).length;
  const above75 = filtered.filter(r => r.percentile != null && r.percentile >= 75 && r.percentile < maxPercentile).length;
  const maxed = filtered.filter(r => r.percentile != null && r.percentile >= maxPercentile).length;

  const displayPlayers = selectedRank === 'all'
    ? totalPlayers
    : playersByRank?.[selectedRank] || 0;

  const handleClassChange = (displayIndex, value) => {
    setStoredClassifications(withClassification(storedClassifications, displayIndex, value));
  };

  // The Toolbar's Sort orders the rows (gap buckets and efficiency are not column sorts), so no header sorts.
  const columns = [
    { key: 'metric', label: 'Metric', value: (row) => row.name },
    {
      key: 'percentile',
      label: 'Percentile',
      numeric: true,
      phone: true,
      cellSx: { minWidth: 96 },
      render: ({ percentile }) => {
        const tone = getPercentileTone(percentile, maxPercentile);
        return <Box>
          <Typography variant={'body2'} component={'div'} fontWeight={600} sx={{ color: toneText(tone) }}>
            {percentile != null ? ordinal(Math.round(percentile)) : '-'}
          </Typography>
          <Box sx={{ height: 6, mt: 0.5, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ width: `${percentile != null ? Math.max(1, percentile) : 0}%`, height: '100%', bgcolor: toneFill(tone), borderRadius: 1 }}/>
          </Box>
        </Box>;
      }
    },
    // The calculator under an opened row says Points with its max, so the row's list leaves it out.
    { key: 'points', label: 'Points', numeric: true, details: false, render: ({ userPoints }) => (hasUserData ? formatGame(userPoints ?? 0, POINTS) : null) },
    ...(targetSet ? [{
      key: 'target',
      label: 'To target',
      numeric: true,
      render: ({ gap }) => (gap == null ? null : gap > 0 ? `+${formatGame(gap, POINTS)}` : <StatusText status={'maxed'}>Reached</StatusText>)
    }] : [])
  ];
  // Tier and type groupings are bands, always open; the summary tiles above count each tier.
  const tierBands = [
    { key: 'below', label: 'Below 25th', tone: 'error', test: (r) => r.percentile != null && r.percentile < 25 },
    { key: 'middle', label: '25th to 75th', tone: 'warning', test: (r) => r.percentile != null && r.percentile >= 25 && r.percentile < 75 },
    { key: 'above', label: 'Above 75th', tone: 'info', test: (r) => r.percentile != null && r.percentile >= 75 && r.percentile < maxPercentile },
    { key: 'maxed', label: 'Maxed', tone: 'success', test: (r) => r.percentile != null && r.percentile >= maxPercentile },
    ...(filtered.some((r) => r.percentile == null) ? [{ key: 'none', label: 'No data', tone: 'muted', test: (r) => r.percentile == null }] : [])
  ];
  const groupMode = toolbar?.view ?? 'none';
  const bands = groupMode === 'tier'
    ? tierBands.map(({ key, label, tone, test }) => ({ key, label, accent: toneFill(tone), rows: filtered.filter(test) }))
    : groupMode === 'type'
      ? Object.entries(CLASSIFICATION_TYPES).map(([typeId, { label, tone }]) => ({
        key: typeId, label, accent: toneFill(tone), rows: filtered.filter((r) => r.classification === Number(typeId))
      }))
      : null;
  const targetLabel = (label) => `${label}${targetSet ? '' : ' (set a target)'}`;

  return (
    <Stack gap={2} sx={{ maxWidth: 1100 }}>
      <Stack direction={'row'} gap={2} alignItems={'flex-end'} flexWrap={'wrap'}>
        <TextField select label={'Compare within'} value={selectedRank} sx={{ minWidth: 180 }}
                   onChange={(event) => setSettings({ rank: event.target.value })}>
          {RANK_OPTIONS.map(({ label, value }) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <NumberField label={'Target percentile'} unit={'%'} value={settings?.target ?? null} min={0} max={100}
                     help={false} sx={{ width: 160 }} onChange={(next) => setSettings({ target: next })}/>
      </Stack>
      <Stack>
        <Typography variant="caption" color="text.secondary">
          {`${formatNum(displayPlayers)} players`}
          {selectedRank !== 'all' && rankThresholds?.[selectedRank] != null
            ? ` (at least ${formatGame(rankThresholds[selectedRank], POINTS)} total points)` : null}
        </Typography>
        {percentileData.createdAt ? <Typography variant="caption" color="text.secondary">
          {`Updated ${formatDate(percentileData.createdAt, { showSeconds: false })}`}
        </Typography> : null}
      </Stack>

      <Box>
        <Toolbar state={toolbar} defaults={RANKINGS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={rows.length} shown={filtered.length} noun={'metrics'} onStickyBottom={setToolbarBottom}>
          <Toolbar.Search placeholder={'Search metrics'}/>
          <Toolbar.Sort options={[['lowest', 'Lowest percentile', 'asc'], ['gap', targetLabel('Smallest gap to target'), 'asc'],
            ['highest_gap', targetLabel('Largest gap to target'), 'asc'], ['efficiency', targetLabel('Best points per percentile'), 'asc']]}/>
          <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
          <Toolbar.View options={[['none', 'List'], ['tier', 'By tier'], ['type', 'By type']]}/>
        </Toolbar>

        {hasUserData && groupMode === 'none' ? <Stack direction="row" gap={2} flexWrap="wrap" mb={2}>
          <StatTile label={'Below 25th'} value={below25} kind={'amount'} status={'problem'}/>
          <StatTile label={'25th to 75th'} value={between} kind={'amount'} status={'needs'}/>
          <StatTile label={'Above 75th'} value={above75} kind={'amount'} status={'info'}/>
          <StatTile label={'Maxed'} value={maxed} kind={'amount'} status={'done'}/>
        </Stack> : null}

        <DataTable
          columns={columns}
          {...(bands ? { bands } : { rows: filtered })}
          rowKey={'index'}
          rowLabel={(row) => row.name}
          // Each row opens its calculator, at every width; two rows can be open at once.
          detail={(row) => <ExpandedCalculator row={row} bounds={row.bounds} percentilePoints={percentilePoints}
                                               hasUserData={hasUserData} onClassChange={handleClassChange}/>}
          surface={'card'}
          stickyTop={toolbarBottom ?? pageTop}
        />
      </Box>
    </Stack>
  );
};

// An opened row: the metric's quantity and points, what the next point and the max take, and a target percentile's
// points
const ExpandedCalculator = ({ row, bounds, percentilePoints, hasUserData, onClassChange }) => {
  const [targetPercentile, setTargetPercentile] = useState(null);
  const { userPoints, quantity, maxPoints, x1, x2, x3, classification, index: displayIndex } = row;

  let requiredPts = null;
  let gap = null;
  if (targetPercentile != null && targetPercentile >= 1 && targetPercentile <= 100) {
    const value = interpolateValue(targetPercentile, bounds, percentilePoints);
    if (value != null) {
      requiredPts = Math.round(value);
      gap = requiredPts - userPoints;
    }
  }

  const nextPointQty = hasUserData && userPoints < maxPoints
    ? calcQuantityForPoints({ x1, x2, x3, points: userPoints + 1 })
    : null;
  const qtyGap = nextPointQty != null ? nextPointQty - quantity : null;
  const maxQty = maxPoints
    ? calcQuantityForPoints({ x1, x2, x3, points: maxPoints })
    : null;
  const requiredQty = requiredPts != null
    ? calcQuantityForPoints({ x1, x2, x3, points: requiredPts })
    : null;
  const targetText = requiredPts == null ? null
    : !hasUserData || gap == null ? `${formatGame(requiredPts, POINTS)} points`
      : gap > 0 ? `Needs ${formatGame(requiredPts, POINTS)} points (+${formatGame(gap, POINTS)} to go${requiredQty != null
        ? `, ${tomeQuantity(row, requiredQty)} quantity` : ''})`
        : <StatusText key={'reached'} status={'done'}>Reached</StatusText>;

  return (
    <Stack gap={1} px={1} pb={1} pt={0.25}>
      {hasUserData ? <ItemCard.Facts rows={[
        ['Quantity', tomeQuantity(row, quantity)],
        ['Points', `${formatGame(userPoints ?? 0, POINTS)} / ${formatGame(maxPoints ?? 0, POINTS)}`],
        maxQty != null ? ['Max quantity', tomeQuantity(row, maxQty)] : null,
        qtyGap != null && qtyGap > 0 ? ['Next point', `+${tomeQuantity(row, qtyGap)} quantity`] : null
      ]}/> : null}
      <Stack direction="row" gap={2} alignItems="flex-end" flexWrap="wrap">
        <TextField select size={'small'} value={classification} sx={{ minWidth: 130 }}
                   slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Metric type' } } }}
                   onChange={(event) => onClassChange(displayIndex, event.target.value)}>
          {Object.entries(CLASSIFICATION_TYPES).map(([id, { label, tone }]) => (
            <MenuItem key={id} value={Number(id)}>
              <Typography variant={'caption'} sx={{ color: toneText(tone) }}>{label}</Typography>
            </MenuItem>
          ))}
        </TextField>
        <NumberField label={'Target'} unit={'%'} ariaLabel={'Target percentile'} value={targetPercentile} min={0} max={100}
                     help={false} sx={{ width: 120 }} onChange={(next) => setTargetPercentile(next)}/>
      </Stack>
      {targetText ? <ItemCard.Facts rows={[['At that target', targetText]]}/> : null}
    </Stack>
  );
};

export default TomeRankings;

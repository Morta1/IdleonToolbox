import React, { useContext, useEffect, useState } from 'react';
import { Box, Card, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { fetchTomePercentiles } from '../../../../services/profiles';
import { cleanUnderscore, commaNotation, notateNumber } from '@utility/helpers';
import NumberField from '@components/common/NumberField';
import SimpleLoader from '@components/common/SimpleLoader';
import useCheckbox from '@components/common/useCheckbox';
import useFormatDate from '@hooks/useFormatDate';
import DataTable from '@components/common/DataTable';
import StatusText from '@components/common/StatusText';
import usePageTop from '@hooks/usePageTop';
import { CLASSIFICATION_TYPES, CLASSIFICATIONS_KEY, classificationsOf, withClassification } from './tomeClassifications';

const RANK_OPTIONS = [
  { label: 'All Players', value: 'all' },
  { label: 'TOP 0.1%', value: '0.1%' },
  { label: 'TOP 0.5%', value: '0.5%' },
  { label: 'TOP 1%', value: '1%' },
  { label: 'TOP 5%', value: '5%' },
  { label: 'TOP 10%', value: '10%' },
  { label: 'TOP 25%', value: '25%' },
  { label: 'TOP 50%', value: '50%' },
  { label: 'TOP 60%', value: '60%' },
  { label: 'TOP 70%', value: '70%' },
  { label: 'TOP 80%', value: '80%' },
  { label: 'TOP 90%', value: '90%' },
  { label: 'TOP 95%', value: '95%' },
];

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

function formatQty(x2, quantity) {
  if (quantity > 1e9 && x2 === 1) return notateNumber(quantity, 'Big');
  return commaNotation(quantity);
}

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
  const [selectedRank, setSelectedRank] = useState('all');
  const [groupMode, setGroupMode] = useState('none');
  const [sortMode, setSortMode] = useState('lowest');
  const [CheckboxHideMaxedEl, hideMaxed] = useCheckbox('Hide maxed');
  // Read after mount (the first render matches the export); no default, so a player who never edited stores nothing.
  const [storedClassifications, setStoredClassifications] = useLocalStorage({ key: CLASSIFICATIONS_KEY });
  const classifications = classificationsOf(storedClassifications);
  const pageTop = usePageTop();
  const [search, setSearch] = useState('');
  const [globalTarget, setGlobalTarget] = useState('');
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
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        Rankings data is not available yet. Check back later.
      </Typography>
    );
  }

  const tome = state?.account?.tome?.tome || [];
  const hasUserData = tome.length > 0;
  const { percentilePoints, totalPlayers, playersByRank, rankThresholds } = percentileData;

  const rows = tome.map((metric, index) => {
    const userPoints = metric.points;
    const bounds = selectedRank === 'all'
      ? percentileData.allPlayers?.[index]
      : percentileData.byRank?.[selectedRank]?.[index];
    const percentile = bounds
      ? interpolatePercentile(userPoints, bounds, percentilePoints)
      : null;
    let gap = null;
    const gp = parseFloat(globalTarget);
    if (!isNaN(gp) && gp >= 1 && gp <= 100 && bounds) {
      const needed = interpolateValue(gp, bounds, percentilePoints);
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
      classification: classifications[index]
    };
  });

  const gpNum = parseFloat(globalTarget);
  const targetSet = !isNaN(gpNum);
  const needsTarget = sortMode === 'gap' || sortMode === 'highest_gap' || sortMode === 'efficiency';
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
  const maxPercentile = percentilePoints[percentilePoints.length - 1];
  const searchLower = search.toLowerCase();
  let filtered = searchLower ? sorted.filter(r => r.name.toLowerCase().includes(searchLower)) : sorted;
  if (hideMaxed) filtered = filtered.filter(r => r.percentile == null || r.percentile < maxPercentile);

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

  // The page's Sort select orders the rows (gap buckets and efficiency are not column sorts), so no header sorts.
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
    { key: 'points', label: 'Points', numeric: true, details: false, render: ({ userPoints }) => (hasUserData ? commaNotation(userPoints) : null) },
    ...(targetSet ? [{
      key: 'target',
      label: 'To target',
      numeric: true,
      render: ({ gap }) => (gap == null ? null : gap > 0 ? `+${commaNotation(gap)}` : <StatusText status={'maxed'}>Reached</StatusText>)
    }] : [])
  ];
  // Tier and type groupings are bands, always open; the summary tiles above count each tier.
  const tierBands = [
    { key: 'below', label: 'Below 25th', tone: 'error', test: (r) => r.percentile != null && r.percentile < 25 },
    { key: 'middle', label: '25th - 75th', tone: 'warning', test: (r) => r.percentile != null && r.percentile >= 25 && r.percentile < 75 },
    { key: 'above', label: 'Above 75th', tone: 'info', test: (r) => r.percentile != null && r.percentile >= 75 && r.percentile < maxPercentile },
    { key: 'maxed', label: 'Maxed', tone: 'success', test: (r) => r.percentile != null && r.percentile >= maxPercentile },
    ...(filtered.some((r) => r.percentile == null) ? [{ key: 'none', label: 'No data', tone: 'muted', test: (r) => r.percentile == null }] : [])
  ];
  const bands = groupMode === 'tier'
    ? tierBands.map(({ key, label, tone, test }) => ({ key, label, accent: toneFill(tone), rows: filtered.filter(test) }))
    : groupMode === 'type'
      ? Object.entries(CLASSIFICATION_TYPES).map(([typeId, { label, tone }]) => ({
        key: typeId, label, accent: toneFill(tone), rows: filtered.filter((r) => r.classification === Number(typeId))
      }))
      : null;

  return (
    <Stack gap={2} sx={{ maxWidth: 1100 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Compare within</InputLabel>
            <Select
              value={selectedRank}
              label="Compare within"
              onChange={(e) => setSelectedRank(e.target.value)}
            >
              {RANK_OPTIONS.map(({ label, value }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            placeholder="Search metrics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: 160 }}
          />
          <NumberField
            ariaLabel="Target percentile for every metric"
            placeholder="Target %"
            unit="%"
            value={globalTarget === '' ? null : Number(globalTarget)}
            min={0}
            max={100}
            help={false}
            onChange={(next) => setGlobalTarget(next == null ? '' : String(next))}
            sx={{ width: 110 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Group by</InputLabel>
            <Select value={groupMode} label="Group by" onChange={(e) => setGroupMode(e.target.value)}>
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="tier">Tier</MenuItem>
              <MenuItem value="type">Type</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack alignItems="flex-end">
          <Typography variant="caption" color="text.secondary">
            {commaNotation(displayPlayers)} players
            {selectedRank !== 'all' && rankThresholds?.[selectedRank] != null
              && ` (${'\u2265'}${commaNotation(rankThresholds[selectedRank])} total PTS)`}
          </Typography>
          {percentileData.createdAt && (
            <Typography variant="caption" color="text.secondary">
              Updated: {formatDate(percentileData.createdAt, { showSeconds: false })}
            </Typography>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" gap={1.5} flexWrap="wrap" alignItems="center">
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort</InputLabel>
          <Select value={sortMode} label="Sort" onChange={(e) => setSortMode(e.target.value)}>
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="lowest">Lowest percentile</MenuItem>
            <MenuItem value="gap" disabled={!targetSet}>
              Smallest gap to target{!targetSet && ' (set Target %)'}
            </MenuItem>
            <MenuItem value="highest_gap" disabled={!targetSet}>
              Largest gap to target{!targetSet && ' (set Target %)'}
            </MenuItem>
            <MenuItem value="efficiency" disabled={!targetSet}>
              Best pts / percentile{!targetSet && ' (set Target %)'}
            </MenuItem>
          </Select>
        </FormControl>
        <CheckboxHideMaxedEl />
      </Stack>

      {hasUserData && groupMode === 'none' && (
        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <SummaryTile count={below25} label="Below 25th" tone="error" />
          <SummaryTile count={between} label="25th - 75th" tone="warning" />
          <SummaryTile count={above75} label="Above 75th" tone="info" />
          <SummaryTile count={maxed} label="Maxed" tone="success" />
        </Stack>
      )}

      <DataTable
        columns={columns}
        {...(bands ? { bands } : { rows: filtered })}
        rowKey={'index'}
        rowLabel={(row) => row.name}
        // Each row opens its calculator, at every width; two rows can be open at once.
        detail={(row) => <ExpandedCalculator row={row} bounds={row.bounds} percentilePoints={percentilePoints}
                                             hasUserData={hasUserData} onClassChange={handleClassChange}/>}
        surface={'card'}
        stickyTop={pageTop}
      />
    </Stack>
  );
};

const SummaryTile = ({ count, label, tone }) => (
  <Card sx={{
    flex: 1,
    p: 1,
    textAlign: 'center',
    border: '1px solid',
    borderColor: 'divider'
  }}>
    <Typography variant={'heroValue'} component={'div'} sx={{ color: toneText(tone) }}>{count}</Typography>
    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
  </Card>
);

const ExpandedCalculator = ({ row, bounds, percentilePoints, hasUserData, onClassChange }) => {
  const [targetPercentile, setTargetPercentile] = useState('');
  const { userPoints, quantity, maxPoints, x1, x2, x3, classification, index: displayIndex } = row;

  let requiredPts = null;
  let gap = null;
  if (targetPercentile !== '') {
    const p = parseFloat(targetPercentile);
    if (!isNaN(p) && p >= 1 && p <= 100) {
      const value = interpolateValue(p, bounds, percentilePoints);
      if (value != null) {
        requiredPts = Math.round(value);
        gap = requiredPts - userPoints;
      }
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

  return (
    <Stack gap={0.75} px={1} pb={1} pt={0.25}>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="center">
        {hasUserData && (
          <>
            <Typography variant="caption" color="text.secondary">
              Quantity: <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>{formatQty(x2, quantity)}</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Points: <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>{commaNotation(userPoints)} / {commaNotation(maxPoints)}</Typography>
            </Typography>
          {maxQty != null && (
            <Typography variant="caption" color="text.secondary">
              Max qty: <Typography component="span" variant="caption" color="text.primary" fontWeight={600}>{formatQty(x2, maxQty)}</Typography>
            </Typography>
          )}
          {qtyGap != null && qtyGap > 0 && (
            <Typography variant="caption" color="text.secondary">
              Next point: <Typography component="span" variant="caption" color="primary.main" fontWeight={600}>+{formatQty(x2, qtyGap)} qty</Typography>
            </Typography>
          )}
          </>
        )}
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select
            value={classification}
            onChange={(e) => onClassChange(displayIndex, e.target.value)}
          >
            {Object.entries(CLASSIFICATION_TYPES).map(([id, { label, tone }]) => (
              <MenuItem key={id} value={Number(id)}>
                <Typography variant={'caption'} sx={{ color: toneText(tone) }}>{label}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">Target:</Typography>
        <NumberField
          ariaLabel="Target percentile"
          placeholder="e.g. 50"
          value={targetPercentile === '' ? null : Number(targetPercentile)}
          min={0}
          max={100}
          help={false}
          sx={{ width: 90 }}
          onChange={(next) => setTargetPercentile(next == null ? '' : String(next))}
        />
        <Typography variant="caption" color="text.secondary">th percentile</Typography>
        {requiredPts != null && (
          <>
            <Typography variant="caption" color="text.secondary">&rarr;</Typography>
            <Typography variant="caption" fontWeight={600} color="primary.main">
              {commaNotation(requiredPts)} PTS
            </Typography>
            {hasUserData && gap != null && (
              <Typography variant="caption" sx={{ color: gap > 0 ? 'text.secondary' : 'text.success' }}>
                {gap > 0
                  ? `(+${commaNotation(gap)} to go${requiredQty != null ? `, need ${formatQty(x2, requiredQty)} qty` : ''})`
                  : '(Already there!)'}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default TomeRankings;

import React, { useContext, useEffect, useState } from 'react';
import { Box, Card, Collapse, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { fetchTomePercentiles } from '../../../../services/profiles';
import { cleanUnderscore, commaNotation, notateNumber } from '@utility/helpers';
import SimpleLoader from '@components/common/SimpleLoader';
import useCheckbox from '@components/common/useCheckbox';
import useFormatDate from '@hooks/useFormatDate';
import { CLASSIFICATION_TYPES, getClassifications, setClassification } from './tomeClassifications';

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

function getPercentileColor(p, maxPercentile) {
  if (p == null) return '#8b949e';
  if (p < 25) return '#f85149';
  if (p < 50) return '#e3b341';
  if (p < 75) return '#d29922';
  if (p >= maxPercentile) return '#3fb950';
  return '#58a6ff';
}

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
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [groupMode, setGroupMode] = useState('none');
  const [sortMode, setSortMode] = useState('lowest');
  const [CheckboxHideMaxedEl, hideMaxed] = useCheckbox('Hide maxed');
  const [classifications, setClassifications] = useState(() => getClassifications());
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

  const targetSet = !isNaN(parseFloat(globalTarget));
  const effectiveSortMode = sortMode === 'gap' && !targetSet ? 'default' : sortMode;
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
    setClassification(displayIndex, value);
    setClassifications(getClassifications());
  };

  return (
    <Stack gap={2} sx={{ maxWidth: 1100 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Compare within</InputLabel>
            <Select
              value={selectedRank}
              label="Compare within"
              onChange={(e) => { setSelectedRank(e.target.value); setExpandedIndex(null); }}
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
          <TextField
            size="small"
            type="number"
            placeholder="Target %"
            value={globalTarget}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') return setGlobalTarget('');
              const num = parseFloat(val);
              if (!isNaN(num) && num >= 0 && num <= 100) setGlobalTarget(val);
            }}
            slotProps={{ htmlInput: { min: 1, max: 100, step: 0.01 } }}
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
          </Select>
        </FormControl>
        <CheckboxHideMaxedEl />
      </Stack>

      {hasUserData && groupMode === 'none' && (
        <Stack direction="row" gap={1.5} flexWrap="wrap">
          <SummaryTile count={below25} label="Below 25th" color="#f85149" />
          <SummaryTile count={between} label="25th - 75th" color="#d29922" />
          <SummaryTile count={above75} label="Above 75th" color="#58a6ff" />
          <SummaryTile count={maxed} label="Maxed" color="#3fb950" />
        </Stack>
      )}

      <Stack gap={0.25}>
        {groupMode === 'tier' ? (
          <>
            <TierGroup label="Below 25th" color="#f85149" rows={filtered.filter(r => r.percentile != null && r.percentile < 25)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />
            <TierGroup label="25th - 75th" color="#d29922" rows={filtered.filter(r => r.percentile != null && r.percentile >= 25 && r.percentile < 75)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />
            <TierGroup label="Above 75th" color="#58a6ff" rows={filtered.filter(r => r.percentile != null && r.percentile >= 75 && r.percentile < maxPercentile)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />
            <TierGroup label="Maxed" color="#3fb950" rows={filtered.filter(r => r.percentile != null && r.percentile >= maxPercentile)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />
            {filtered.some(r => r.percentile == null) && (
              <TierGroup label="No data" color="#8b949e" rows={filtered.filter(r => r.percentile == null)}
                hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />
            )}
          </>
        ) : groupMode === 'type' ? (
          <>
            {Object.entries(CLASSIFICATION_TYPES).map(([typeId, { label, color }]) => {
              const typeRows = filtered.filter(r => r.classification === Number(typeId));
              return <TierGroup key={typeId} label={label} color={color} rows={typeRows}
                hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} onClassChange={handleClassChange} />;
            })}
          </>
        ) : (
          filtered.map((row) => (
            <MetricRow
              key={row.index}
              row={row}
              hasUserData={hasUserData}
              expanded={expandedIndex === row.index}
              onToggle={() => setExpandedIndex(expandedIndex === row.index ? null : row.index)}
              percentilePoints={percentilePoints}
              onClassChange={handleClassChange}
            />
          ))
        )}
      </Stack>
    </Stack>
  );
};

const TierGroup = ({ label, color, rows, hasUserData, expandedIndex, setExpandedIndex, percentilePoints, onClassChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ mb: 1 }}>
      <Card
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          borderLeft: `3px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <Typography sx={{ fontSize: 22, fontWeight: 700, color, minWidth: 36 }}>{rows.length}</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', flex: 1 }}>{label}</Typography>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          {open ? '▾' : '▸'}
        </Typography>
      </Card>
      <Collapse in={open} timeout={250}>
        <Box>
          {rows.length > 0 ? rows.map((row) => (
            <MetricRow
              key={row.index}
              row={row}
              hasUserData={hasUserData}
              expanded={expandedIndex === row.index}
              onToggle={() => setExpandedIndex(expandedIndex === row.index ? null : row.index)}
              percentilePoints={percentilePoints}
              onClassChange={onClassChange}
            />
          )) : (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1.5, display: 'block' }}>
              No metrics in this group. You can change a metric's classification by clicking on it.
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const SummaryTile = ({ count, label, color }) => (
  <Card sx={{
    flex: 1,
    p: 1,
    textAlign: 'center',
    border: '1px solid',
    borderColor: `${color}55`
  }}>
    <Typography sx={{ fontSize: 22, fontWeight: 700, color }}>{count}</Typography>
    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
  </Card>
);

const MetricRow = ({ row, hasUserData, expanded, onToggle, percentilePoints, onClassChange }) => {
  const { name, userPoints, percentile, bounds, index, gap } = row;
  const color = getPercentileColor(percentile, percentilePoints[percentilePoints.length - 1]);
  const barWidth = percentile != null ? Math.max(1, percentile) : 0;

  return (
    <Box sx={{
      border: expanded ? '1px solid' : '1px solid transparent',
      borderColor: expanded ? 'divider' : 'transparent',
      borderRadius: 2,
      bgcolor: expanded ? 'action.hover' : 'transparent',
      mb: expanded ? 0.5 : 0
    }}>
      <Box
        onClick={onToggle}
        sx={{
          py: 0.75,
          px: 1,
          cursor: 'pointer',
          borderRadius: 2,
          '&:hover': { bgcolor: expanded ? 'transparent' : 'action.hover' }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={{ xs: 0.25, sm: 0 }}>
          <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: 'text.secondary' }}>
            {name}
          </Typography>
          <Stack direction="row" gap={1} alignItems="center" flexShrink={0}>
            <Typography sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600, color }}>
              {percentile != null ? ordinal(Math.round(percentile)) : '-'}
            </Typography>
            <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: 'text.secondary', minWidth: 55, textAlign: 'right' }}>
              {hasUserData ? `${commaNotation(userPoints)} PTS` : '-'}
            </Typography>
            {gap != null && (
              <Typography sx={{ fontSize: { xs: 11, sm: 12 }, minWidth: 65, textAlign: 'right', color: gap > 0 ? 'warning.main' : 'success.main' }}>
                {gap > 0 ? `+${commaNotation(gap)}` : '\u2713'}
              </Typography>
            )}
          </Stack>
        </Stack>
        <Box sx={{
          height: 6,
          bgcolor: (theme) => expanded ? theme.palette.background.default : theme.palette.action.hover,
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          <Box sx={{ width: `${barWidth}%`, height: '100%', bgcolor: color, borderRadius: 1 }} />
        </Box>
      </Box>

      {expanded && (
        <ExpandedCalculator
          row={row}
          bounds={bounds}
          percentilePoints={percentilePoints}
          hasUserData={hasUserData}
          onClassChange={onClassChange}
        />
      )}
    </Box>
  );
};

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
            sx={{ fontSize: 12, height: 28 }}
          >
            {Object.entries(CLASSIFICATION_TYPES).map(([id, { label, color: c }]) => (
              <MenuItem key={id} value={Number(id)}>
                <Typography sx={{ fontSize: 12, color: c }}>{label}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Stack direction="row" gap={1.5} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">Target:</Typography>
        <input
          type="number"
          min="1"
          max="100"
          step="0.01"
          value={targetPercentile}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') return setTargetPercentile('');
            const num = parseFloat(val);
            if (!isNaN(num) && num >= 0 && num <= 100) setTargetPercentile(val);
          }}
          placeholder="e.g. 50"
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #333',
            background: '#0d1117',
            color: '#e6edf3',
            width: 70,
            fontSize: 12,
            textAlign: 'center'
          }}
        />
        <Typography variant="caption" color="text.secondary">th percentile</Typography>
        {requiredPts != null && (
          <>
            <Typography variant="caption" color="text.secondary">&rarr;</Typography>
            <Typography variant="caption" fontWeight={600} color="primary.main">
              {commaNotation(requiredPts)} PTS
            </Typography>
            {hasUserData && gap != null && (
              <Typography variant="caption" sx={{ color: gap > 0 ? 'text.secondary' : 'success.main' }}>
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

import React, { useContext, useEffect, useState } from 'react';
import { Box, Card, Collapse, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { fetchTomePercentiles } from '../../../../services/profiles';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import SimpleLoader from '@components/common/SimpleLoader';
import useCheckbox from '@components/common/useCheckbox';
import useFormatDate from '@hooks/useFormatDate';

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
  if (value <= boundaries[0]) return percentilePoints[0];
  if (value >= boundaries[boundaries.length - 1]) return percentilePoints[percentilePoints.length - 1];
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

function getPercentileColor(p) {
  if (p == null) return '#8b949e';
  if (p < 25) return '#f85149';
  if (p < 50) return '#e3b341';
  if (p < 75) return '#d29922';
  if (p < 90) return '#7ee787';
  return '#3fb950';
}

const TomeRankings = () => {
  const { state } = useContext(AppContext);
  const [percentileData, setPercentileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRank, setSelectedRank] = useState('all');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [CheckboxGroupEl, groupByTier] = useCheckbox('Group by tier');
  const [search, setSearch] = useState('');
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
    return {
      name: cleanUnderscore(metric.name?.replace('(Tap_for_more_info)', '') || ''),
      userPoints,
      percentile,
      bounds,
      index
    };
  });

  const sorted = [...rows].sort((a, b) => (a.percentile ?? 101) - (b.percentile ?? 101));
  const searchLower = search.toLowerCase();
  const filtered = searchLower ? sorted.filter(r => r.name.toLowerCase().includes(searchLower)) : sorted;

  const below25 = filtered.filter(r => r.percentile != null && r.percentile < 25).length;
  const between = filtered.filter(r => r.percentile != null && r.percentile >= 25 && r.percentile < 75).length;
  const above75 = filtered.filter(r => r.percentile != null && r.percentile >= 75).length;

  const displayPlayers = selectedRank === 'all'
    ? totalPlayers
    : playersByRank?.[selectedRank] || 0;

  return (
    <Stack gap={2} sx={{ maxWidth: 800 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" gap={2} flexWrap="wrap">
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
            sx={{ width: 180 }}
          />
          <CheckboxGroupEl />
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

      {hasUserData && !groupByTier && (
        <Stack direction="row" gap={1.5}>
          <SummaryTile count={below25} label="Below 25th" color="#f85149" />
          <SummaryTile count={between} label="25th - 75th" color="#d29922" />
          <SummaryTile count={above75} label="Above 75th" color="#3fb950" />
        </Stack>
      )}

      <Stack gap={0.25}>
        {groupByTier ? (
          <>
            <TierGroup label="Below 25th" color="#f85149" rows={filtered.filter(r => r.percentile != null && r.percentile < 25)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} />
            <TierGroup label="25th - 75th" color="#d29922" rows={filtered.filter(r => r.percentile != null && r.percentile >= 25 && r.percentile < 75)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} />
            <TierGroup label="Above 75th" color="#3fb950" rows={filtered.filter(r => r.percentile != null && r.percentile >= 75)}
              hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} />
            {filtered.some(r => r.percentile == null) && (
              <TierGroup label="No data" color="#8b949e" rows={filtered.filter(r => r.percentile == null)}
                hasUserData={hasUserData} expandedIndex={expandedIndex} setExpandedIndex={setExpandedIndex} percentilePoints={percentilePoints} />
            )}
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

            />
          ))
        )}
      </Stack>
    </Stack>
  );
};

const TierGroup = ({ label, color, rows, hasUserData, expandedIndex, setExpandedIndex, percentilePoints }) => {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
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
          {rows.map((row) => (
            <MetricRow
              key={row.index}
              row={row}
              hasUserData={hasUserData}
              expanded={expandedIndex === row.index}
              onToggle={() => setExpandedIndex(expandedIndex === row.index ? null : row.index)}
              percentilePoints={percentilePoints}

            />
          ))}
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

const MetricRow = ({ row, hasUserData, expanded, onToggle, percentilePoints }) => {
  const { name, userPoints, percentile, bounds, index } = row;
  const color = getPercentileColor(percentile);
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
              {percentile != null ? `${Math.round(percentile)}th` : '-'}
            </Typography>
            <Typography sx={{ fontSize: { xs: 12, sm: 13 }, color: 'text.secondary', minWidth: 55, textAlign: 'right' }}>
              {hasUserData ? `${commaNotation(userPoints)} PTS` : '-'}
            </Typography>
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
          userPoints={userPoints}
          bounds={bounds}
          percentilePoints={percentilePoints}
          hasUserData={hasUserData}
        />
      )}
    </Box>
  );
};

const ExpandedCalculator = ({ userPoints, bounds, percentilePoints, hasUserData }) => {
  const [targetPercentile, setTargetPercentile] = useState('');

  let requiredPts = null;
  let gap = null;
  if (targetPercentile !== '') {
    const p = parseFloat(targetPercentile);
    if (!isNaN(p) && p >= 1 && p <= 99.99) {
      const value = interpolateValue(p, bounds, percentilePoints);
      if (value != null) {
        requiredPts = Math.round(value);
        gap = requiredPts - userPoints;
      }
    }
  }

  return (
    <Stack direction="row" gap={1.5} alignItems="center" px={1} pb={1} pt={0.25} flexWrap="wrap">
      <Typography variant="caption" color="text.secondary">Target:</Typography>
      <input
        type="number"
        min="1"
        max="99.99"
        step="0.01"
        value={targetPercentile}
        onChange={(e) => {
          const val = e.target.value;
          if (val === '') return setTargetPercentile('');
          const num = parseFloat(val);
          if (!isNaN(num) && num >= 0 && num <= 99.99) setTargetPercentile(val);
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
              {gap > 0 ? `(+${commaNotation(gap)} to go)` : '(Already there!)'}
            </Typography>
          )}
        </>
      )}
    </Stack>
  );
};

export default TomeRankings;

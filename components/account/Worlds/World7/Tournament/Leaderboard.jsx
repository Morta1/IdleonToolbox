import React, { useEffect, useState } from 'react';
import { Collapse, CircularProgress, IconButton, Paper, Stack, Tab, Tabs, Typography, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { prefix } from '@utility/helpers';
import { getLeaderboard } from '../../../../../firebase';
import { companions as companionsData } from '@website-data';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const RankLabel = ({ rank }) => {
  const color = rank <= 3 ? MEDAL_COLORS[rank - 1] : 'text.secondary';
  const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
  return (
    <Typography variant="body2" fontWeight={rank <= 3 ? 'bold' : 'normal'} sx={{ color, minWidth: 36 }}>
      {rank}{suffix}
    </Typography>
  );
};

const parseEntries = (raw) =>
  (raw ?? []).map((entryStr, idx) => {
    const parts = entryStr.split(',');
    const name = parts[0];
    const points = parseInt(parts[1], 10) || 0;
    const companions = parts.slice(2).map(Number)
      .map((i) => companionsData?.[i])
      .filter(Boolean);
    const totalTourPower = companions.reduce((sum, c) => sum + (c?.tourPower ?? 0), 0);
    return { rank: idx + 1, name, points, companions, totalTourPower };
  });

const LeaderboardRow = ({ rank, name, points, companions, totalTourPower, isPlayer }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 1.5,
        py: 0.75,
        bgcolor: isPlayer ? 'action.selected' : 'transparent',
        borderColor: isPlayer ? 'primary.main' : 'divider',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.5}>
        <RankLabel rank={rank} />
        <Typography variant="body2" fontWeight={isPlayer ? 'bold' : 'normal'} flexGrow={1}>
          {name}
        </Typography>
        {totalTourPower > 0 && (
          <Stack direction="row" alignItems="center" gap={0.5}>
            <img width={14} height={14} style={{ objectFit: 'contain' }} src={`${prefix}etc/Companion_Power.png`} alt="" />
            <Typography variant="caption" color="text.secondary">{totalTourPower}</Typography>
          </Stack>
        )}
        <Divider flexItem orientation='vertical' />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
          {points} pts
        </Typography>
        <Divider flexItem orientation='vertical' />
        <Typography variant="caption" color="text.secondary">{companions.length} companions</Typography>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
          <ExpandMoreIcon sx={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }} fontSize="small" />
        </IconButton>
      </Stack>
      <Collapse in={expanded}>
        <Stack direction="row" gap={0.5} pt={1} flexWrap="wrap">
          {companions.map((c, i) => (
            <img
              key={i}
              width={32} height={32}
              style={{ objectFit: 'contain' }}
              src={`${prefix}afk_targets/${c.name}.png`}
              title={c.name}
              alt=""
            />
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
};

const Leaderboard = ({ tournament }) => {
  const { divisionIndex = 0, divisionNames = [], playerName = null } = tournament ?? {};

  const [selectedTab, setSelectedTab] = useState(divisionIndex);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLeaderboard([]);
    getLeaderboard(selectedTab).then((raw) => {
      setLeaderboard(parseEntries(raw));
      setLoading(false);
    });
  }, [selectedTab]);

  if (!divisionNames.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No leaderboard data available. Sign in to view divisions.
      </Typography>
    );
  }

  return (
    <Stack gap={2}>
      <Tabs value={selectedTab} onChange={(_, val) => setSelectedTab(val)} variant="scrollable">
        {divisionNames.map((name, idx) => (
          <Tab key={idx} label={name} value={idx} />
        ))}
      </Tabs>

      {loading ? (
        <CircularProgress size={24} />
      ) : !leaderboard.length ? (
        <Typography variant="body2" color="text.secondary">No data for this division.</Typography>
      ) : (
        <Stack gap={1}>
          <Typography variant="body2" color="text.secondary">
            {divisionNames[selectedTab]} Division — {leaderboard.length} players
          </Typography>
          <Stack gap={0.5} maxWidth={600}>
            {leaderboard.map(({ rank, name, points, companions, totalTourPower }) => {
              const isPlayer = playerName && name === playerName;
              return (
                <LeaderboardRow
                  key={name}
                  rank={rank}
                  name={name}
                  points={points}
                  companions={companions}
                  totalTourPower={totalTourPower}
                  isPlayer={isPlayer}
                />
              );
            })}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};

export default Leaderboard;

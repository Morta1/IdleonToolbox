import React, { useContext, useEffect, useState } from 'react';
import { Collapse, CircularProgress, IconButton, Paper, Stack, Typography, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { prefix } from '@utility/helpers';
import { loadFirebase } from '../../../../../firebase/lazy';
import { AppContext } from '@components/common/context/AppProvider';
import { companions as companionsData } from '@website-data';
import { monsterImage } from '@utility/spriteImages';
import Tabber from '@components/common/Tabber';
import Notice, { retryAction } from '@components/common/Notice';

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
            <img width={14} height={14} style={{ objectFit: 'contain' }} src={`${prefix}etc/Companion_Power.png`} alt="Companion Power" />
            <Typography variant="caption" color="text.secondary">{totalTourPower}</Typography>
          </Stack>
        )}
        <Divider flexItem orientation='vertical' />
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
          {points} pts
        </Typography>
        <Divider flexItem orientation='vertical' />
        <Typography variant="caption" color="text.secondary">{companions.length} companions</Typography>
        <IconButton size="small" onClick={() => setExpanded((v) => !v)}
                    aria-label={expanded ? 'Hide companions' : 'Show companions'} aria-expanded={expanded}>
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
              src={monsterImage(c.name)}
              title={c.name}
              alt={c.name}
            />
          ))}
        </Stack>
      </Collapse>
    </Paper>
  );
};

const Leaderboard = ({ tournament }) => {
  const { state } = useContext(AppContext);
  // Firestore answers a signed-in player only (live too). A guest, the sample account and a viewed profile are
  // told so and never ask, so they never download Firebase for it either.
  const signedIn = Boolean(state?.signedIn);
  const { divisionIndex = 0, divisionNames = [], playerName = null } = tournament ?? {};

  const [selectedTab, setSelectedTab] = useState(divisionIndex);
  // Retry asks again: each attempt is a request of its own.
  const [attempt, setAttempt] = useState(0);
  // The answer to one request (a division and an attempt): { request, tab, entries, failed }.
  const [result, setResult] = useState(null);
  const request = `${selectedTab}:${attempt}`;

  useEffect(() => {
    if (!signedIn) return undefined;
    let current = true;
    loadFirebase()
      .then(({ getLeaderboard }) => getLeaderboard(selectedTab))
      .then((raw) => ({ entries: parseEntries(raw), failed: false }), (error) => {
        console.error('Error fetching leaderboard:', error);
        return { entries: [], failed: true };
      })
      .then((answer) => {
        if (current) setResult({ request, tab: selectedTab, ...answer });
      });
    return () => {
      current = false;
    };
  }, [signedIn, selectedTab, request]);

  // The division names are game data, so this never shows today (Decision 9: no gate for a guest)
  if (!divisionNames.length) return <Notice>No tournament divisions to show.</Notice>;
  if (!signedIn) return <Notice tone={'signin'}>The tournament leaderboard shows here once you sign in.</Notice>;

  const answered = result?.request === request;
  // A retry keeps the failed note up until its answer; a new failure is a new note, read out again.
  const failed = result?.failed && result.tab === selectedTab;
  const loading = !answered && !failed;

  return (
    <Stack gap={2}>
      <Tabber level={2} label={'Divisions'} disableQuery tabs={divisionNames} activeTab={selectedTab} onTabChange={setSelectedTab}/>

      {loading ? (
        <CircularProgress size={24} />
      ) : failed ? (
        <Notice key={result.request} tone={'error'} action={retryAction(() => setAttempt((count) => count + 1), !answered)}>
          Could not load this division.
        </Notice>
      ) : !result.entries.length ? (
        <Notice>No data for this division.</Notice>
      ) : (
        <Stack gap={1}>
          <Typography variant="body2" color="text.secondary">
            {divisionNames[selectedTab]} Division: {result.entries.length} players
          </Typography>
          <Stack gap={0.5} maxWidth={600}>
            {result.entries.map(({ rank, name, points, companions, totalTourPower }) => {
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

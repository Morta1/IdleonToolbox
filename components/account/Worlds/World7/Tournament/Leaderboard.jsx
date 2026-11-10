import React, { useContext, useEffect, useState } from 'react';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getNumberWithOrdinal } from '@utility/helpers';
import { loadFirebase } from '../../../../../firebase/lazy';
import { AppContext } from '@components/common/context/AppProvider';
import { companions as companionsData } from '@website-data';
import Tabber from '@components/common/Tabber';
import Notice, { retryAction } from '@components/common/Notice';
import Panel from '@components/common/cards/Panel';
import InfoButton from '@components/common/InfoButton';
import { formatPowerRange, PetList, teamPowerRange, UNKNOWN_UPGRADES_NOTE } from './Matches';

const parseEntries = (raw) =>
  (raw ?? []).map((entryStr, idx) => {
    const parts = entryStr.split(',');
    const name = parts[0];
    const points = parseInt(parts[1], 10) || 0;
    const companions = parts.slice(2).map(Number)
      .map((i) => companionsData?.[i])
      .filter(Boolean);
    return { rank: idx + 1, name, points, companions, power: teamPowerRange(companions) };
  });

// The rank as a word in the row's icon slot, in the text color (the medal colors went: the word says it)
const RankLabel = ({ rank }) => <Typography variant={'body2'} component={'span'}
                                            sx={{ minWidth: 40, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
  {getNumberWithOrdinal(rank)}
</Typography>;

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
          Couldn't load this division.
        </Notice>
      ) : !result.entries.length ? (
        <Notice>No data for this division.</Notice>
      ) : (
        // A two-column list with sprites, so a Panel list (3g's borderline rule): the rank, the name, the pets by name
        <Panel title={`${divisionNames[selectedTab]} division`} meta={`${formatNum(result.entries.length)} players`}
               aside={<InfoButton label={'team power'}>{UNKNOWN_UPGRADES_NOTE}</InfoButton>}>
          {result.entries.map(({ rank, name, points, companions, power }) => <Panel.Row
            key={name} icon={<RankLabel rank={rank}/>} name={cleanUnderscore(name)}
            sub={<>{playerName && name === playerName ? 'You · ' : null}<PetList pets={companions}/></>}
            value={`${formatNum(points)} pts`} valueSub={`${formatPowerRange(power)} power`}/>)}
        </Panel>
      )}
    </Stack>
  );
};

export default Leaderboard;

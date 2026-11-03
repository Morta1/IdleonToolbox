import React from 'react';
import { cleanUnderscore, formatNum, msToClock } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Stack } from '@mui/material';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

// Gambit_0 to 5, the parser's extraCalculations 65 to 70: the parser slices the runs from the save, so the page draws
// all six for a save that has none yet
const GAMBIT_RUNS = 6;
// A bonus's name; the first one carries the game's own '(TAP ME)' hint, which the parser means to drop but misses
// before its underscores are cleaned
const bonusName = (name) => cleanUnderscore(name).replace('(TAP ME)', '').trim();

const Gambit = ({ hole }) => {
  const gambit = hole?.caverns?.gambit;
  const nextUnlock = gambit?.nextUnlock;
  const points = gambit?.points ?? 0;
  const doublers = gambit?.summoningDoublers;
  const totalTime = getHoleLeaderboardTotals(hole).gambitTime;
  // The game's $ in the first bonus is the doublers left to appoint (Gambit_SummoningDoublersLeft)
  const doublersLeft = Math.max(0, (doublers?.total ?? 0) - (doublers?.appointed ?? 0));

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      {Array.from({ length: GAMBIT_RUNS }, (_, index) => {
        const time = gambit?.times?.[index] ?? 0;
        // A record, so the clock stays (Follow-up 5a); 0 is a run never done
        return <StatTile key={`run-${index}`} label={`Gambit ${index + 1}`} icon={`etc/Gambit_${index}.png`}
                         value={time > 0 ? msToClock(time * 1000) : '-'}/>;
      })}
      <StatTile label={'Total gambit time'} value={totalTime > 0 ? msToClock(totalTime * 1000) : '-'}/>
      <StatTile label={'Base points'} value={formatGame(Math.floor(gambit?.basePoints ?? 0), 'Holes.GambitPts')}/>
      <StatTile label={'Points'} value={formatGame(Math.floor(points), 'Holes.GambitPts')}/>
      <StatTile label={'Points multi'} value={`${formatGame(gambit?.pointsMulti ?? 1, 'Holes.GambitPTSmulti')}x`}/>
      {nextUnlock ? <StatTile label={'Next bonus at'} value={formatGame(nextUnlock.pointsReq ?? 0, 'Holes.GambitPtsREQ')}
                              sub={bonusName(nextUnlock.name)}/> : null}
      <StatTile label={'Summoning doublers'} value={`${formatNum(doublers?.appointed ?? 0)} / ${formatNum(doublers?.total ?? 0)}`}/>
      {opalsFoundTile(hole, 13)}
    </Stack>
    <CardGrid size={'s'}>
      {(gambit?.bonuses ?? []).map(({ name, description, pointsReq }, index) => {
        const reached = points > pointsReq;
        const isNext = !reached && nextUnlock?.pointsReq === pointsReq;
        return <ItemCard key={`bonus-${index}`} title={bonusName(name)} dimmed={!reached && !isNext}
                         status={reached ? 'done' : undefined} statusLabel={reached ? 'Unlocked' : undefined}
                         meta={isNext ? 'Next' : undefined}
                         footer={reached ? null
                           : <ItemCard.Facts rows={[['Points needed', formatGame(pointsReq ?? 0, 'Holes.GambitPtsREQ')]]}/>}>
          {description && description !== 'no'
            ? <ItemCard.Desc text={description.replace('$', formatGame(doublersLeft, 'Holes.Gambit_SummoningDoublersLeft'))}/>
            : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Gambit;

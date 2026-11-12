import { Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import React from 'react';
import { getTotalUpgradeLevels } from '@parsers/world-3/equinox';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';

const UNLOCK_REWARD = 'Unlock_next_Equinox_upgrade';
// "+10_Max_LV_for_'Voter_Rights'_Equinox_Upgrade"
const MAX_REWARD = /^\+(\d+)_Max_LV_for_'([^']+)'/;
const isDone = (challenge) => challenge?.current === -1;

// The challenges behind an upgrade, from their rewards: the n-th "Unlock next Equinox upgrade" opens upgrade n (the
// parser's own count of the completed ones), and a "+N Max LV for 'Name'" raises that upgrade's max
const challengeLinks = (challenges) => {
  const unlocks = (challenges ?? []).filter(({ reward }) => reward === UNLOCK_REWARD);
  const maxes = {};
  (challenges ?? []).forEach((challenge) => {
    const [, amount, name] = String(challenge?.reward ?? '').match(MAX_REWARD) ?? [];
    if (name) (maxes[name] ??= []).push({ ...challenge, amount: Number(amount) });
  });
  return { unlocks, maxes };
};

const challengeText = (challenge) => cleanUnderscore(challenge?.label?.capitalize?.() ?? challenge?.label ?? '');

// A challenge's state in a list: done, or its progress (or the research it waits on)
const challengeState = (challenge) => (isDone(challenge) ? <StatusText status={'done'}>Done</StatusText>
  : challenge?.locked ? 'Requires Research G8'
    : `${formatNum(challenge?.current ?? 0, 'whole')} / ${formatNum(challenge?.goal ?? 0, 'whole')}`);

// The max levels the unfinished challenges can still add (the done ones are already in its max). The challenges
// themselves are the Challenges tab's: a list of them here was too long for a note, and "+5 / +57" read as a riddle
const maxRow = (list) => {
  const left = list.filter((challenge) => !isDone(challenge)).reduce((sum, { amount }) => sum + amount, 0);
  return left > 0 ? ['Challenges can add', `+${formatNum(left)} max LV`] : null;
};

// sectionFailed: the levels and locks are unknown, so the tile shows no number and no card a state
const Upgrades = ({ upgrades, challenges, sectionFailed }) => {
  const { unlocks, maxes } = challengeLinks(challenges);
  return <>
    <StatTile label={'Total upgrade levels'} value={sectionFailed ? '-' : getTotalUpgradeLevels(upgrades)} kind={'amount'}
              sx={{ mb: 2 }}/>
    <CardGrid size={'m'}>
      {(upgrades ?? []).map(({ name, desc, lvl, maxLvl, unlocked, bonus }, index) => {
        if (name === 'Hmm...') return null;
        const level = lvl ?? 0;
        const state = sectionFailed ? undefined : !unlocked ? 'locked' : level >= maxLvl ? 'maxed' : undefined;
        const unlockedBy = !sectionFailed && !unlocked && index > 0 ? unlocks[index - 1] : null;
        const maxList = maxes[name] ?? [];
        // Dream[2] (Equinox Dreams) keeps counting past its max; the game shows MAX LV once lvl >= max
        return <ItemCard key={`${name}-${index}`} icon={`etc/Dream_Upgrade_${index + 1}.png`}
                         title={cleanUnderscore(name?.capitalize?.() ?? name)}
                         level={{ value: Math.min(level, maxLvl ?? 0), max: maxLvl }} status={state}>
          {/* The game leaves a blank line between the effect and its total: blank lines drop */}
          <ItemCard.Desc text={(desc ?? []).map((line) => cleanUnderscore(line)).filter((line) => line?.trim())}/>
          <ItemCard.Facts rows={[
            name === 'Food_Lust' ? ['Bosses killed', sectionFailed ? '-' : bonus ?? 0, 'amount'] : null,
            !sectionFailed && maxList.length ? maxRow(maxList) : null
          ]}/>
          {/* What opens it: the challenge whose reward is this upgrade, and how far along it is */}
          {unlockedBy ? <ItemCard.Section label={'Unlocks with'}>
            <Typography variant={'body2'}>{challengeText(unlockedBy)}</Typography>
            <Typography variant={'body2'} color={'text.secondary'} component={'div'}>{challengeState(unlockedBy)}</Typography>
          </ItemCard.Section> : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default Upgrades;

import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import BreedingUpgrades from '@components/account/Worlds/World4/Breeding/BreedingUpgrades';
import BreedingArena from '@components/account/Worlds/World4/Breeding/BreedingArena';
import Territory from '@components/account/Worlds/World4/Breeding/Territory';
import { formatDuration, formatNum, getTabs } from 'utility/helpers';
import { NextSeo } from 'next-seo';
import Pets from '@components/account/Worlds/World4/Breeding/Pets/Pets';
import { getJewelBonus } from '@parsers/world-4/lab';
import { getMealsBonusByEffectOrStat } from '@parsers/world-4/cooking';
import { getBubbleBonus } from '@parsers/world-2/alchemy';
import { getAchievementStatus } from '@parsers/achievements';
import { isMasteryBonusUnlocked } from '@parsers/misc';
import Timer from '../../../components/common/Timer';
import Tabber from '../../../components/common/Tabber';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { PAGES } from '@components/constants';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import { Duration } from '@components/common/Num';
import { additiveGroup, createBreakdown, divideGroup, flat, flatLines, percent } from '@parsers/breakdown';

// The game's egg time (other sections' bonuses): 2 hours over the jewel, meal, bubble, achievement, skill mastery and
// vote bonuses
const BASE_EGG_SECONDS = 7200;
const eggSpeedSources = (account) => [
  percent('Emerald Rhinestone (Jewel)', getJewelBonus(account?.lab?.jewels, 11)),
  percent('Meals', getMealsBonusByEffectOrStat(account, null, 'TimeEgg')),
  percent('Egg Ink (Bubble)', getBubbleBonus(account, 'EGG_INK', false)),
  percent('Achievement', 10 * getAchievementStatus(account?.achievements, 220)),
  percent('Breeding mastery', 15 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.breeding?.rank, 1)),
  percent('Vote', getVoteBonus(account, 16) || 0)
];

const calcTimePerEgg = (account) => {
  const sum = eggSpeedSources(account).reduce((total, { value }) => total + (Number(value) || 0), 0);
  return BASE_EGG_SECONDS / (1 + sum / 100) * 1000;
};

// 2 hours over the egg speed sources, in seconds
const eggTimeBreakdown = (account, text) => createBreakdown('Time per egg', text, [
  divideGroup('Time per egg', [
    flat('Base', BASE_EGG_SECONDS, { formatted: formatDuration(BASE_EGG_SECONDS) }),
    additiveGroup('Egg speed', eggSpeedSources(account))
  ], { formatted: text })
]);

const rangeText = (range) => `${formatNum(Math.floor(range?.minPower ?? 0))} to ${formatNum(Math.floor(range?.maxPower ?? 0))}`;

const Breeding = () => {
  const { state } = useContext(AppContext);
  const breeding = state?.account?.breeding ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'breeding');
  const timePerEgg = calcTimePerEgg(state?.account);
  const now = new Date().getTime();

  const eggs = breeding?.eggs ?? [];
  const capacity = breeding?.eggCapacity ?? 0;
  const laid = eggs.filter((level) => level > 0);
  const ranges = breeding?.eggsPowerRange ?? [];
  // The best egg on the nest names the range; with none, the first tier's
  const best = ranges[Math.max(0, Math.max(0, ...laid) - 1)];
  // Info 5: the power per egg tier was a list in a hover note; it is the range's own breakdown
  const powerRange = ranges.length ? createBreakdown('Egg power range', rangeText(best), flatLines(ranges.map((range, index) => ({
    name: `Tier ${index + 1} egg`, value: range?.maxPower ?? 0, formatted: rangeText(range)
  }))), { combine: 'list' }) : undefined;

  return (
    <>
      <NextSeo
        title="Breeding | Idleon Toolbox"
        description="Keep track of your breeding upgrades, eggs and arena upgrades"
      />
      {sectionFailed ? <MissingData name={'Breeding'} failed atZero={!isParseFailed(state?.account)}/> : null}
      {/* In a failed section every tile reads "-": even the egg time takes the shiny pets' meal bonus */}
      <PageSummary>
        <StatTile label={'Time to next egg'}
                  info={'The game updates this timer only when you enter the World 4 town.'}
                  value={sectionFailed ? '-' : <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                                                     date={now + (timePerEgg - (breeding?.timeToNextEgg ?? 0))}/>}/>
        <StatTile label={'Time per egg'} value={sectionFailed ? '-' : <Duration seconds={timePerEgg / 1000}/>}
                  breakdownTitle={'Time per egg'}
                  breakdown={sectionFailed ? undefined : eggTimeBreakdown(state?.account, formatDuration(timePerEgg / 1000))}/>
        <StatTile label={'Eggs'} icon={'data/PetEgg1.png'}
                  value={sectionFailed ? '-' : `${formatNum(laid.length)} / ${formatNum(capacity)}`}/>
        <StatTile label={'Egg power range'} value={sectionFailed ? '-' : rangeText(best)}
                  breakdown={sectionFailed ? undefined : powerRange}
                  breakdownTitle={'Egg power range'} breakdownNoun={'tiers'}/>
      </PageSummary>
      {capacity > 0 ? <CardGrid size={'icon'} sx={{ mb: 3 }}>
        {Array.from({ length: capacity }, (_, slot) => eggs[slot] > 0
          ? <IconTile key={slot} icon={`data/PetEgg${eggs[slot]}.png`} alt={`Tier ${eggs[slot]} egg`}
                      details={`Tier ${eggs[slot]} egg: ${rangeText(ranges[eggs[slot] - 1])} power`}/>
          : <IconTile key={slot} status={'empty'}/>)}
      </CardGrid> : null}
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 4'].categories, 'breeding')} clearOnChange={['nt']}>
        <Pets {...breeding}
              lab={state?.account?.lab}
              account={state?.account}
              characters={state?.characters}
              lastUpdated={state?.lastUpdated}
              sectionFailed={sectionFailed}
        />
        <Territory {...breeding} spices={state?.account?.cooking?.spices} lastUpdated={state?.lastUpdated}/>
        <BreedingUpgrades petUpgrades={breeding?.petUpgrades}
                          deadCells={breeding?.deadCells}
                          account={state?.account}
                          meals={state?.account?.cooking?.meals}
                          sectionFailed={sectionFailed}/>
        <BreedingArena {...breeding} sectionFailed={sectionFailed}/>
      </Tabber>
    </>
  );
};

export default Breeding;

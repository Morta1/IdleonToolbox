import { NextSeo } from 'next-seo';
import React, { useContext } from 'react';
import Tabber from '@components/common/Tabber';
import WinnerBonuses from '@components/account/Worlds/World6/Summoning/WinnerBonuses';
import { AppContext } from '@components/common/context/AppProvider';
import Upgrades from '@components/account/Worlds/World6/Summoning/Upgrades';
import { formatDuration, formatNum, getTabs, secondsToShortDuration } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import Num from '@components/common/Num';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import Battles from '@components/account/Worlds/World6/Summoning/Battles';
import { PAGES } from '@components/constants';
import Stones from '@components/account/Worlds/World6/Summoning/Stones';
import {
  FAMILIAR_EXP_MIN_CLAIM_SECONDS,
  getFamiliarLevelGains,
  getPendingFamiliarExp,
  SUMMONING_COLOURS,
  summonEssenceColor
} from '@parsers/world-6/summoning';
import useHydrated from '@hooks/useHydrated';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import useTabIndex from '@hooks/useTabIndex';

const Summoning = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['world 6'].categories, 'summoning');
  const [tabIndex] = useTabIndex(tabs);
  const {
    winnerBonuses,
    upgrades,
    essences,
    essenceGain,
    allBattles,
    armyHealth,
    armyDamage,
    armyHealthBreakdown,
    armyDamageBreakdown,
    highestEndlessLevel,
    totalUpgradesLevels,
    summoningStones,
    familiarExp,
    familiarCostResetSeconds
  } = state?.account?.summoning || {};
  const sectionFailed = isSectionFailed(state?.account, 'summoning');
  const parseFailed = isParseFailed(state?.account);
  // Date.now() differs between the build and the client, so the elapsed time waits for hydration
  const hydrated = useHydrated();
  const pendingExp = getPendingFamiliarExp(familiarExp, hydrated ? state?.lastUpdated : undefined);
  const levelGains = getFamiliarLevelGains(state?.characters, pendingExp.exp);
  const gains = levelGains.map(({ level, newLevel }) => newLevel - level);
  const minGain = gains.length ? Math.min(...gains) : 0;
  const maxGain = gains.length ? Math.max(...gains) : 0;
  const gainRange = minGain === maxGain ? `${maxGain}` : `${minGain}-${maxGain}`;
  // Info 5: each character's level gain, a list in a note before
  const levelGainsBreakdown = createBreakdown('Familiar levels', `+${gainRange} Lv`,
    flatLines(levelGains.map(({ name, level, newLevel }) => ({
      name,
      value: newLevel,
      formatted: newLevel > level ? `${level} → ${newLevel}` : `${level}`
    }))),
    { combine: 'list' });
  const claimText = pendingExp.claimable
    ? `${secondsToShortDuration(pendingExp.seconds, { minUnit: 'minute' })} unclaimed`
    : `Claimable in ${formatDuration(FAMILIAR_EXP_MIN_CLAIM_SECONDS - pendingExp.seconds)}`;
  return <>
    <NextSeo
      title="Summoning | Idleon Toolbox"
      description="View your summoning upgrades, winner bonuses, and battle rewards in Legends of Idleon"
    />
    {sectionFailed ? <MissingData name={'Summoning'} failed atZero={!parseFailed}/>
      : <NotReached name={'Summoning'} reached={totalUpgradesLevels > 0}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile icon={'etc/Endless_Summoning.png'} label={'Highest endless level'} value={highestEndlessLevel ?? 0}
                kind={'amount'}/>
      {/* Each tile opens its own number: the unclaimed EXP has no breakdown, the multi behind it is its own tile */}
      <StatTile icon={'data/SumExp.png'} label={'Unclaimed familiar EXP'} value={`${formatNum(pendingExp?.exp, 'whole')} EXP`}
                sub={<>{claimText}{maxGain > 0 ? <>{', '}<Breakdown asValue data={levelGainsBreakdown}>
                  {`+${gainRange} Lv`}</Breakdown></> : null}</>}/>
      <StatTile label={'Summoning EXP multi'} value={<Num value={familiarExp?.expMulti ?? 1} game={'Summoning.SummEXPgain'} unit={'x'}/>}
                breakdown={familiarExp?.expMultiBreakdown}/>
      {Object.keys(summonEssenceColor).map((key) => {
        const index = Number(key);
        const gain = essenceGain?.[index];
        return <StatTile key={index} icon={`data/SummC${index + 1}.png`} label={`${SUMMONING_COLOURS[index]} essence`}
                         value={essences?.[index] ?? 0} kind={'whole'}
                         sub={gain?.unlocked ? <Breakdown asValue data={gain?.breakdown}>
                           {`+${formatGame(gain?.value, 'Summoning.SummRockEssGen')}/hr`}</Breakdown> : null}/>;
      })}
      {/* Decision 2: the number the disabled toggle showed */}
      <StatTile label={'Total upgrades'} value={totalUpgradesLevels ?? 0} kind={'amount'}/>
    </PageSummary>
    <Tabber tabs={tabs}>
      {parseFailed ? null : <Upgrades upgrades={upgrades} essences={essences}
                familiarCostReset={state?.lastUpdated + familiarCostResetSeconds * 1000}/>}
      <WinnerBonuses winnerBonuses={winnerBonuses}/>
      {parseFailed ? null : <Battles battles={allBattles} armyHealth={armyHealth} armyDamage={armyDamage}
               armyHealthBreakdown={armyHealthBreakdown} armyDamageBreakdown={armyDamageBreakdown}
               highestEndlessLevel={highestEndlessLevel} winnerBonuses={winnerBonuses}/>}
      <Stones stones={summoningStones}/>
    </Tabber>
  </>
};

export default Summoning;

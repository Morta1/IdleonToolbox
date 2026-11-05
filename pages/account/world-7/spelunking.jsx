import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import { getAmberIndex, getAmberDenominator } from '@parsers/world-7/spelunking';
import { formatNum } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import StatTile from '@components/common/cards/StatTile';
import PageSummary from '@components/common/cards/PageSummary';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World7/Spelunking/Upgrades';
import Lore from '@components/account/Worlds/World7/Spelunking/Lore';
import Elixirs from '@components/account/Worlds/World7/Spelunking/Elixirs';
import UpgradeOptimizer from '@components/account/Worlds/World7/Spelunking/UpgradeOptimizer';
import { OPT } from '@parsers/accountOptions';

const Spelunking = () => {
  const { state } = useContext(AppContext);
  const { upgrades,
    chapters,
    currentAmber,
    bestCaveLevels,
    amberGain,
    maxDailyPageReads,
    staminaRegenRate,
    discoveriesCount,
    maxDiscoveries,
    loreBosses,
    elixirs,
    ownedElixirs,
    ownedSlots,
    maxElixirDuplicates,
    power,
    totalGrandDiscoveries,
    overstimRate,
    overstimLevel,
    overstimCurrent,
    charactersAtMaxStamina,
    charactersStamina,
    overstimStack,
    overstimQtyREQ2,
    trackometerProgress,
    trackometerUnlocked,
    manicModeActive,
    spelunkingEfficiency,
    spelunkingEfficiencyBreakdown,
    saveTotals
  } = state?.account?.spelunking || {};
  const denominator = getAmberDenominator(state?.account);
  // The game's amber line: the save's amount over the denominator, commas under 1e9 and Big past it
  // (Spelunk.AmberDenominator). Dividing first also turns a save's text number past 1e21 into a number.
  const amber = Number(currentAmber ?? 0) / denominator;
  // The drawer totals the tile's own text, so both read 30.987 (the parser's total is in MultiplierInfo)
  const staminaRegenText = formatNum(staminaRegenRate?.value, 'amount', { precise: true });
  const staminaRegenDrawer = staminaRegenRate?.breakdown ? { ...staminaRegenRate.breakdown, totalValue: staminaRegenText } : undefined;

  return <>
    <NextSeo
      title="Spelunking | Idleon Toolbox"
      description="Keep track of your spelunking levels, upgrades and stats"
    />
    <PageSummary>
      <StatTile label={'Power'} icon={'data/CaveShopUpg17.png'}
                value={<Num value={power?.value} game={'Spelunk.POW'}/>} breakdown={power?.breakdown}/>
      <StatTile label={'Amber Found'} value={formatGame(amber, 'Spelunk.AmberDenominator', { whole: true })} icon={`data/CaveAmber${getAmberIndex(state?.account)}.png`}/>
      <StatTile label={'Amber Gain'} icon={`data/CaveAmber${getAmberIndex(state?.account)}.png`}
                value={<Num value={amberGain?.value} game={'Spelunk.AmberGain'}/>} breakdown={amberGain?.breakdown}/>
      <StatTile label={'Daily Page Reads'}
                value={`${state?.account?.accountOptions?.[OPT.dailyPageReads] ?? 0} / ${maxDailyPageReads}`}/>
      <StatTile label={'Stamina Regen Rate'} icon={'data/CaveShopUpg4.png'}
                value={staminaRegenText} breakdown={staminaRegenDrawer}/>
      <StatTile label={'Overstim'} icon={'data/CaveShopUpg6.png'}
                value={`${formatNum(overstimLevel)} + ${formatNum(overstimCurrent, 'pct')}`}/>
      <StatTile label={'Overstim Rate'} icon={'data/CaveShopUpg6.png'} value={formatNum(overstimRate)}
                info={`Every character's stamina regen feeds overstim once they're topped off. ${charactersAtMaxStamina ?? 0} of ${charactersStamina?.length ?? 0} are at max stamina right now, the rest fill their missing stamina first.`}/>
      <StatTile label={'Discoveries'} value={`${discoveriesCount} / ${maxDiscoveries}`}/>
      <StatTile label={'Grand Discoveries'} value={totalGrandDiscoveries} kind={'amount'}/>
      <StatTile label={'Spelunking Efficiency'}
                value={<Num value={spelunkingEfficiency} game={'Spelunk.SpelunkingEfficiency'}/>}
                breakdown={spelunkingEfficiencyBreakdown}/>
      {trackometerUnlocked ? <StatTile label={'Stamina Trackometer'} icon={'data/CaveShopUpg59.png'}
                                       value={formatNum(overstimStack, 'level')}
                                       sub={`Next level ${formatGame(trackometerProgress, 'Spelunk.OverstimQtyREQ2', { whole: true })} / ${formatGame(overstimQtyREQ2, 'Spelunk.OverstimQtyREQ2', { whole: true })}`}/> : null}
      <StatTile label={'Manic Mode'} value={manicModeActive ? 'Active' : 'Inactive'}
                status={manicModeActive ? 'active' : undefined}/>
    </PageSummary>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'spelunking')} clearOnChange={['nt']}>
      <Upgrades upgrades={upgrades} totalUpgradeLevels={saveTotals?.upgradeLevels} amber={amber} denominator={denominator} amberIndex={getAmberIndex(state?.account)} />
      <Lore
        chapters={chapters}
        loreBosses={loreBosses}
        bestCaveLevels={bestCaveLevels}
        account={state?.account}
      />
      <Elixirs elixirs={elixirs} ownedElixirs={ownedElixirs} ownedSlots={ownedSlots} maxElixirDuplicates={maxElixirDuplicates} />
      <UpgradeOptimizer character={state?.characters?.[0]} account={state?.account} />
    </Tabber>
  </>
}

export default Spelunking;
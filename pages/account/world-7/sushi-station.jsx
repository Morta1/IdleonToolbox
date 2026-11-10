import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { createBreakdown, info, listGroup } from '@parsers/breakdown';
import { formatNum, getTabs, secondsToCoarseDuration } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import Num from '@components/common/Num';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Sushi from '@components/account/Worlds/World7/SushiStation/Sushi';
import Upgrades from '@components/account/Worlds/World7/SushiStation/Upgrades';
import Bonuses from '@components/account/Worlds/World7/SushiStation/Bonuses';
import SushiBonuses from '@components/account/Worlds/World7/SushiStation/SushiBonuses';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { UPGRADES_AHEAD_SETTINGS, UpgradesAheadSettings } from '@components/common/LevelsAhead';

const toDuration = (hours) => secondsToCoarseDuration((hours ?? 0) * 3600) ?? 'never';

// Info lines carry no unit, so a zero value is never hidden as inactive
const buildMultiBreakdown = ({ statName, multi, generationLabel, rawLabel, raw, perHr, extraSources = [], breakpoints }) =>
  createBreakdown(statName, formatNum(1 + (multi ?? 0) / 100, 'mult', { precise: true }), [
    listGroup('Next breakpoints', breakpoints?.map(({ multi: target, required, hours }) =>
      info(formatNum(target, 'mult'), required, { formatted: `${formatNum(required, 'whole')} · ${toDuration(hours)}` })) ?? []),
    listGroup(generationLabel, [
      info(rawLabel, raw ?? 0, { formatted: formatNum(Math.floor(raw ?? 0)) }),
      info('Per hour', perHr ?? 0, { formatted: perHr > 0 ? formatNum(perHr) : 'Not generating' }),
      ...extraSources
    ])
  ], { combine: 'list' });

const SushiStation = () => {
  const { state } = useContext(AppContext);
  const sushiStation = state?.account?.sushiStation;
  const sectionFailed = isSectionFailed(state?.account, 'sushiStation');
  const [settings, setSettings, resetSettings] = usePageSettings('sushi-station', UPGRADES_AHEAD_SETTINGS);

  const {
    uniqueSushi,
    nextFuelCost,
    fuel,
    currency,
    upgrades,
    knowledge,
    rogBonuses,
    slots,
    fireplaces,
    shakerUses,
    knowledgeSummary,
    sushiCooking,
    sparks,
    sparkBonus,
    saveTotals
  } = sushiStation || {};
  const overtuned = currency?.overtuned;
  const nextTier = uniqueSushi ?? 0;
  const nextSushi = nextTier < (rogBonuses?.length ?? 0) ? knowledge?.[nextTier] : null;
  // Decision 8: a chance past 100% is a certain Perfecto
  const perfectoChance = Math.min(100, (sushiCooking?.perfectOdds ?? 0) * 100);
  const sparkBreakdown = buildMultiBreakdown({
    statName: 'Spark multi',
    multi: sparkBonus?.multi,
    generationLabel: 'Spark generation',
    rawLabel: 'Sparks',
    raw: sparks,
    perHr: sparkBonus?.perHr,
    breakpoints: sparkBonus?.nextBreakpoints,
    extraSources: [
      info('Potassium fireplaces', sparkBonus?.potassiumCount ?? 0, {
        formatted: `${formatNum(sparkBonus?.potassiumCount ?? 0)} / ${formatNum(fireplaces?.length ?? 0)}`
      }),
      info('Boosts', 0, { formatted: 'All fireplace bonuses' }),
      info('Each 0.01x costs', 0, { formatted: '~4x the previous sparks' })
    ]
  });
  const overtunedBreakdown = buildMultiBreakdown({
    statName: 'Overtuned multi',
    multi: overtuned?.multi,
    generationLabel: 'Overtuned fuel generation',
    rawLabel: 'Overtuned fuel',
    raw: overtuned?.value,
    perHr: overtuned?.perHr,
    breakpoints: overtuned?.nextBreakpoints,
    extraSources: [
      info('Source', 0, { formatted: 'Fuel generated while at max capacity' }),
      info('Boosts', 0, { formatted: 'All Bucks gained' }),
      ...(overtuned?.hoursToFuelCap > 0
        ? [info('Fuel reaches cap in', overtuned.hoursToFuelCap, { formatted: toDuration(overtuned.hoursToFuelCap) })]
        : [])
    ]
  });

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Sushi Station | Idleon Toolbox"
      description="Track your Sushi Station upgrades, sushi collection, fuel, and Ring of Gains bonuses in Legends of Idleon World 7"
    />
    {/* Only an upgrade with levels left to buy is priced ahead */}
    {upgrades?.some((upgrade) => upgrade && upgrade.level < upgrade.maxLevel)
      ? <PageSettings state={settings} defaults={UPGRADES_AHEAD_SETTINGS} onChange={setSettings} onReset={resetSettings}>
        <UpgradesAheadSettings/>
      </PageSettings> : null}

    {sectionFailed ? <MissingData name={'Sushi Station'} failed atZero={!isParseFailed(state?.account)}/>
      : <NotReached name={'the Sushi Station'} reached={uniqueSushi > 0}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Unique sushi'} value={uniqueSushi ?? 0} kind={'amount'}/>
      {/* The upgrade panel's own print, so the balance reads as Upgrades' costs do */}
      <StatTile label={'Bucks'} icon={'etc/Bucks.png'}
                value={<Num value={Math.floor(currency?.bucks ?? 0)} game={'SushiStuff.UpgCost'} whole/>}/>
      <StatTile label={'Bucks per hour'} icon={'etc/Bucks.png'}
                value={<Num value={Math.floor(currency?.currencyPerHR ?? 0)} game={'SushiStuff.CurrencyperHR'}/>}/>
      {currency?.combo?.unlocked ? <StatTile label={'Combo multi'} icon={'etc/Bucks.png'}
                                             value={<Num value={currency?.combo?.multi ?? 1} game={'SushiStuff.ComboMulti'} unit={'x'}/>}
                                             sub={`Best combo ${formatNum(currency?.combo?.best ?? 0)}`}
                                             info={'Multiplies all Bucks gained. Combining sushi adds the created tier to the combo, cooking new sushi or stalling ends it. Based on your best combo ever, caps just under 101x.'}/> : null}
      <DoublerUsageCard title={'Doublers'} doubler={state?.account?.menagerie?.doublers?.sushi} icon={DOUBLER_ICONS.sushi}/>
      <StatTile label={'Fuel'} icon={'etc/Fuel.png'}
                value={`${formatGame(fuel?.current ?? 0, 'SushiStuff.FuelCap', { whole: true })} / ${formatGame(fuel?.cap ?? 0, 'SushiStuff.FuelCap', { whole: true })}`}/>
      <StatTile label={'Fuel per hour'} icon={'etc/Fuel.png'} value={formatGame(fuel?.generation ?? 0, 'SushiStuff.FuelGen')}/>
      {/* Decision 2: the multis keep Precise's 3 decimals (1.122x); the phone list fixes the wrap */}
      {sparks > 0 || sparkBonus?.potassiumCount > 0
        ? <StatTile label={'Spark multi'} breakdown={sparkBreakdown} skipNotation/> : null}
      {overtuned?.unlocked ? <StatTile label={'Overtuned multi'} breakdown={overtunedBreakdown} skipNotation/> : null}
      {nextSushi ? <StatTile label={'Next unlock'} icon={`data/Sushi${nextTier}.png`}
                             value={`${nextSushi?.name} (${formatGame(Math.ceil(nextFuelCost), 'SushiStuff.FuelCost', { whole: true })} fuel)`}
                             info={`Cook a Tier ${nextTier + 1} sushi to discover ${nextSushi?.name}.`}/> : null}
      {sushiCooking?.nextUnperfectedIdx >= 0
        ? <StatTile label={'Perfecto chance'} value={formatNum(perfectoChance, 'pct')}
                    info={`Base chance to Perfecto ${knowledge?.[sushiCooking?.nextUnperfectedIdx]?.name ?? 'the next sushi'}; past 100% it is certain.`}/>
        : null}
      <StatTile label={'Salt Shaker'} value={Number(shakerUses?.[0] ?? 0)} kind={'amount'} info={'Chance to tier-up all sushi.'}/>
      <StatTile label={'Pepper Shaker'} value={Number(shakerUses?.[1] ?? 0)} kind={'amount'}
                info={'Chance to Perfecto sushi (2x knowledge bonus).'}/>
      <StatTile label={'Saffron Shaker'} value={Number(shakerUses?.[2] ?? 0)} kind={'amount'}
                info={'Generate 1 hour\'s worth of Bucks instantly.'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'sushiStation')}>
      <Sushi slots={slots} knowledge={knowledge} fireplaces={fireplaces}/>
      <Upgrades upgrades={upgrades} totalUpgradeLevels={saveTotals?.upgradeLevels} characters={state?.characters}
                  bucks={currency?.bucks} doublersOwned={state?.account?.menagerie?.doublers?.sushi?.owned}
                  levelsAhead={settings?.levelsAhead ?? 1}/>
      <Bonuses rogBonuses={rogBonuses} uniqueSushi={uniqueSushi} knowledge={knowledge}
               totalKnowledgeLevels={saveTotals?.knowledgeLevels} totalPerfectos={saveTotals?.perfectos}/>
      <SushiBonuses knowledgeSummary={knowledgeSummary} knowledge={knowledge}/>
    </Tabber>
  </SummaryFailed>;
};

export default SushiStation;

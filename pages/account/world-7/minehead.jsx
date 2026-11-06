import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Upgrades, { MINE_CURRENCY_ICON } from '@components/account/Worlds/World7/Minehead/Upgrades';
import Opponents from '@components/account/Worlds/World7/Minehead/Opponents';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import { MINEHEAD_BASE_LIVES } from '@parsers/world-7/minehead';

const Minehead = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const section = account?.minehead;
  const sectionFailed = isSectionFailed(account, 'minehead');
  const {
    opponentsBeat,
    mineCurrency,
    dailyTriesLeft,
    dailyTriesMax,
    maxHP_You,
    baseDMG,
    currencyGain,
    currencyGainBreakdown,
    upgrades,
    opponents
  } = section ?? {};
  // Decision 13: Minehead.CurrencyGain's stored rule is short of the game's switch, so the amount kind; the drawer reads
  // the tile's own text
  const perHourText = formatNum(currencyGain ?? 0);

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Minehead | Idleon Toolbox"
      description="Track your Minehead upgrade levels, opponent stats, and bonus progression in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'Minehead'} failed={sectionFailed} atZero={!isParseFailed(account)}/>
      : <NotReached name={'Minehead'} reached={opponentsBeat > 0 || mineCurrency > 0}/>}
    <PageSummary failed={sectionFailed}>
      {/* The upgrade panel prints the balance beside each cost in its rule (Minehead.UpgCost), so the Summary does too */}
      <StatTile label={'Mine currency'} icon={MINE_CURRENCY_ICON}
                value={<Num value={mineCurrency ?? 0} game={'Minehead.UpgCost'} whole/>}/>
      <StatTile label={'Daily tries'} value={`${formatNum(dailyTriesLeft ?? 0)} / ${formatNum(dailyTriesMax ?? 3)}`}/>
      <StatTile label={'Opponents beaten'} value={opponentsBeat ?? 0} kind={'amount'}/>
      <StatTile label={'Max lives'} value={maxHP_You ?? MINEHEAD_BASE_LIVES} kind={'amount'}/>
      <DoublerUsageCard title={'Doublers'} doubler={account?.menagerie?.doublers?.minehead} icon={DOUBLER_ICONS.minehead}/>
      <StatTile label={'Base damage'} value={formatGame(baseDMG ?? 1, 'Minehead.BaseDMG')}/>
      <StatTile label={'Mine currency per hour'} value={perHourText}
                breakdown={currencyGainBreakdown ? { ...currencyGainBreakdown, totalValue: perHourText } : undefined}
                breakdownTitle={'Mine currency per hour'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'minehead')}>
      <Upgrades upgrades={upgrades} mineCurrency={mineCurrency ?? 0}
                doublersOwned={account?.menagerie?.doublers?.minehead?.owned ?? 0}/>
      <Opponents opponents={opponents}/>
    </Tabber>
  </SummaryFailed>;
};

export default Minehead;

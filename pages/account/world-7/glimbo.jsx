import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { formatGame } from '@utility/gameNotation';
import { formatNum } from '@utility/helpers';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import GlimboTrades from '@components/account/Worlds/World7/Glimbo/GlimboTrades';
import { getResearchGridBonus } from '@parsers/world-7/research';
import { getAllItems } from '@parsers/items';

const Glimbo = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const section = account?.minehead;
  const sectionFailed = isSectionFailed(account, 'minehead');
  const { glimbo, glimboTotalTrades } = section ?? {};
  // How many of each trade item the account holds, in every inventory and storage
  const owned = (state?.characters && account ? getAllItems(state.characters, account) : [])
    .reduce((counts, item) => ({ ...counts, [item?.rawName]: (counts[item?.rawName] ?? 0) + (item?.amount || 0) }), {});
  const insiderUnlocked = getResearchGridBonus(account, 168, 0) >= 1;
  const dropRateBonus = insiderUnlocked ? getResearchGridBonus(account, 168, 2) : 0;
  const nextStep = 100 * (Math.floor((glimboTotalTrades ?? 0) / 100) + 1);

  return <>
    <NextSeo
      title="Glimbo | Idleon Toolbox"
      description="Track your Glimbo Swap Meet trades, max level bonuses, and currency costs in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'Glimbo'} failed={sectionFailed} atZero={!isParseFailed(account)}/>
      : <NotReached name={'Glimbo'} reached={glimboTotalTrades > 0}/>}
    <PageSummary failed={sectionFailed}>
      {/* Research's Glimbo Insider Trading Secrets square: a drop rate multi that grows every 100 trades, the number the
          game draws on the Glimbo screen */}
      <StatTile label={'Total trades'} value={formatGame(glimboTotalTrades ?? 0, 'Minehead.GlimboTotalTrades', { whole: true })}
                sub={insiderUnlocked ? <>
                  <Num value={1 + (dropRateBonus ?? 0) / 100} game={'Minehead.GlimboDRmulti'} unit={'x'}/>
                  {` drop rate · next step at ${formatNum(nextStep)} trades`}
                </> : undefined}
                info={insiderUnlocked
                  ? 'The Glimbo Insider Trading Secrets square in the Research grid gives a drop rate multi for every 100 trades.'
                  : 'The Glimbo Insider Trading Secrets square in the Research grid adds a drop rate multi for every 100 trades.'}/>
    </PageSummary>
    <GlimboTrades glimbo={glimbo} owned={owned}/>
  </>;
};

export default Glimbo;

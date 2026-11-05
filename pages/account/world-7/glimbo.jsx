import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import GlimboTrades from '@components/account/Worlds/World7/Glimbo/GlimboTrades';
import { getResearchGridBonus } from '@parsers/world-7/research';

const Glimbo = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const section = account?.minehead;
  const sectionFailed = isSectionFailed(account, 'minehead');
  const { glimbo, glimboTotalTrades } = section ?? {};
  const dropRateBonus = getResearchGridBonus(account, 168, 0) >= 1 ? getResearchGridBonus(account, 168, 2) : 0;

  return <>
    <NextSeo
      title="Glimbo | Idleon Toolbox"
      description="Track your Glimbo Swap Meet trades, max level bonuses, and currency costs in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'Glimbo'} failed={sectionFailed}/> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Total trades'} value={formatGame(glimboTotalTrades ?? 0, 'Minehead.GlimboTotalTrades', { whole: true })}/>
      {/* Reads the Research grid */}
      <StatTile label={'Drop rate bonus'} failed={false}
                value={<Num value={1 + (dropRateBonus ?? 0) / 100} game={'Minehead.GlimboDRmulti'} unit={'x'}/>}/>
    </PageSummary>
    <GlimboTrades glimbo={glimbo}/>
  </>;
};

export default Glimbo;

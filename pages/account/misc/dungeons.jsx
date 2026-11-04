import React, { useContext } from 'react';
import { formatNum, getTabs } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import useFormatDate from '@hooks/useFormatDate';
import { AppContext } from 'components/common/context/AppProvider';
import Timer from 'components/common/Timer';
import { calcHappyHours, getDungeons } from '../../../parsers/dungeons';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import { NextSeo } from 'next-seo';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Upgrades from '../../../components/account/Misc/Dungeons/Upgrades';
import Tabber from '../../../components/common/Tabber';
import RngItems from '../../../components/account/Misc/Dungeons/RngItems';
import Traits from '../../../components/account/Misc/Dungeons/Traits';
import { PAGES } from '@components/constants';

// A failed section draws the parser's own catalog on an empty save: names and sprites, nothing owned
const dungeonsCatalog = () => {
  try {
    return getDungeons(undefined, []);
  } catch {
    return {};
  }
};

const Dungeons = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const dungeonsFailed = isSectionFailed(state?.account, 'dungeons');
  const dungeons = dungeonsFailed ? dungeonsCatalog() : (state?.account?.dungeons ?? {});
  const { rank, progress, rankReq, boostedRuns, credits, flurbos } = dungeons;
  const shown = (value) => (dungeonsFailed ? '-' : value);

  const nextHappyHours = calcHappyHours(state?.serverVars?.HappyHours) ?? [];
  // The schedule is a list, so a breakdown (Info board step 5); the next one is the tile's own countdown. The dates come
  // from the current clock, not the save's, so the countdown takes no lastUpdated (it would subtract the save's age)
  const happyHours = nextHappyHours.length > 1 ? createBreakdown('Happy hours', '', flatLines(nextHappyHours.map((date, index) => ({
    name: `#${formatNum(index + 1)}`, value: date, formatted: formatDate(date, { showSeconds: false })
  }))), { combine: 'list' }) : undefined;

  return (
    <>
      <NextSeo
        title="Dungeons | Idleon Toolbox"
        description="Dungeon information including happy hour times, currency, upgrades and more"
      />
      {dungeonsFailed ? <MissingData name={'Dungeons'} failed/> : null}
      <PageSummary>
        <StatTile label={'Rank'} icon={dungeonsFailed ? undefined : `data/Dung_Rank${rank}.png`} value={shown(formatNum(rank ?? 0))}
                  sub={dungeonsFailed ? undefined : `${formatNum(progress ?? 0)} / ${formatNum(Number(rankReq) || 0)} EXP`}/>
        <StatTile label={'Boosted runs'} icon={'etc/boosted-runs.png'} value={shown(formatNum(boostedRuns ?? 0))}/>
        <StatTile label={'Credits'} icon={'data/DungCredits1.png'} value={shown(formatGame(credits ?? 0, 'DungeonCalc.PassiveStatCost'))}/>
        <StatTile label={'Flurbos'} icon={'data/DungCredits2.png'} value={shown(formatGame(flurbos ?? 0, 'DungeonCalc.PassiveStatCost2'))}/>
        <StatTile label={'Next happy hour'}
                  value={nextHappyHours.length ? <Timer type={'countdown'} date={nextHappyHours[0]}/> : '-'}
                  sub={nextHappyHours.length ? formatDate(nextHappyHours[0], { showSeconds: false }) : undefined}
                  info={nextHappyHours.length ? undefined : 'The happy hour schedule comes from the game\'s server with your save.'}
                  breakdown={happyHours} breakdownTitle={'Happy hours'} breakdownNoun={'happy hours'}/>
      </PageSummary>
      <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'dungeons')}>
        <Upgrades {...dungeons} sectionFailed={dungeonsFailed}/>
        <RngItems {...dungeons} sectionFailed={dungeonsFailed}/>
        <Traits {...dungeons} sectionFailed={dungeonsFailed}/>
      </Tabber>
    </>
  );
};

export default Dungeons;

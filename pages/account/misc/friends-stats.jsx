import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { formatNum } from '@utility/helpers';
import { getFriendBonusStats } from '@parsers/misc';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

// A failed section draws the parser's own seven bonuses on an empty account: their names, nothing given
const friendsCatalog = () => {
  try {
    return getFriendBonusStats({});
  } catch {
    return {};
  }
};

const FRIEND_LEVEL_CAP = 30000;

const FriendsStats = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'friendBonusStats');
  const { bonuses = [], slots, multiplier } = (failed ? friendsCatalog() : state?.account?.friendBonusStats) ?? {};
  // Each picked bonus fills a slot: an open one is a bonus to pick now
  const filled = (bonuses ?? []).filter((bonus) => bonus?.friendName).length;

  return (
    <>
      <NextSeo
        title="Friends Stats | Idleon Toolbox"
        description="View all friendship bonuses and their effects on your Legends of Idleon account progression"
      />
      {failed ? <MissingData name={'Friends Stats'} failed atZero/> : null}
      <PageSummary>
        <StatTile label={'Slots'} value={failed ? '-' : `${formatNum(filled)} / ${formatNum(slots ?? 0)}`}/>
        <StatTile label={'Multiplier'} value={failed ? '-' : formatNum(multiplier ?? 1, 'mult')}
                  info={'From the Mr Pig companion and an upgraded Spearfish companion'}/>
      </PageSummary>
      <CardGrid size={'s'}>
        {(bonuses ?? []).map((bonus, index) => <ItemCard key={`friend-bonus-${bonus?.statIndex ?? index}`}
                                                         title={failed
                                                           ? `${bonus?.name ?? ''}`.replace(/^%\s*/, '')
                                                           : `${formatNum(bonus?.value ?? 0, 'pct', { bare: true })}${bonus?.name ?? ''}`}
                                                         // game: a friend's level counts up to 30,000 (FriendBonusQTY)
                                                         meta={failed ? undefined : bonus?.friendName
                                                           ? `${bonus.friendName} · ${formatNum(bonus?.level ?? 0, 'level')} / ${formatNum(FRIEND_LEVEL_CAP)}`
                                                           : 'No friend gives it yet'}
                                                         dimmed={!failed && !bonus?.friendName} keepMeta/>)}
      </CardGrid>
    </>
  );
};

export default FriendsStats;

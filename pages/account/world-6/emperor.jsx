import { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const Emperor = () => {
  const { state } = useContext(AppContext);
  const {
    bossHp,
    highestEmperorShowdown,
    bonuses,
    bonusMulti,
    upcomingBonuses,
    attempts,
    maxAttempts,
    dailyAttempts
  } = state?.account?.emperor || {};
  const sectionFailed = isSectionFailed(state?.account, 'emperor');
  const nextLevelBonus = upcomingBonuses?.[0];
  // Info 5: the lists that sat in notes open as breakdowns, read from the current level
  const bossHpBreakdown = createBreakdown('Boss HP', formatNum(bossHp?.[0]),
    flatLines(bossHp?.map((hp, index) => ({
      name: `Lv ${(highestEmperorShowdown ?? 0) + index}`,
      value: hp,
      formatted: formatNum(hp)
    })) ?? []),
    { combine: 'list' });
  const upcomingBreakdown = createBreakdown('Upcoming bonuses', cleanUnderscore(nextLevelBonus?.bonus ?? ''),
    flatLines(upcomingBonuses?.map(({ level, bonus }) => ({
      name: `Lv ${level}`,
      value: level,
      formatted: cleanUnderscore(bonus)
    })) ?? []),
    { combine: 'list' });

  return <>
    <NextSeo
      title="Emperor | Idleon Toolbox"
      description="Track your Emperor showdown progress, boss HP, attempt counts, and bonus rewards in Legends of Idleon"
    />
    {sectionFailed ? <MissingData name={'the Emperor'} failed atZero={!isParseFailed(state?.account)}/> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Highest showdown'} value={highestEmperorShowdown ?? 0} kind={'amount'}/>
      <StatTile label={'Daily attempts'} icon={'data/GemP45.png'} value={dailyAttempts ?? 0} kind={'amount'}/>
      <StatTile label={'Attempts'} icon={'data/GemP45.png'} value={`${attempts} / ${maxAttempts}`}/>
      <StatTile label={'Boss HP'} value={formatNum(bossHp?.[0])} breakdown={bossHpBreakdown}/>
      {bonusMulti ? <StatTile label={'Bonus Multi'} value={formatNum(bonusMulti?.totalValue, 'mult')}
                              breakdown={bonusMulti}/> : null}
      {nextLevelBonus ? <StatTile label={'Next level bonus'} value={cleanUnderscore(nextLevelBonus?.bonus)}
                                  breakdown={upcomingBreakdown} breakdownTitle={'Next level bonus'}/> : null}
    </PageSummary>
    <CardGrid size={'m'}>
      {bonuses?.map(({ bonus, baseBonus, indexes, value, icon }, index) => {
        const [realValue, ...nameParts] = cleanUnderscore(bonus).split(' ');
        const [baseValue] = cleanUnderscore(baseBonus || bonus).split(' ');
        // "20% cheaper Farming Upgrades" leaves a lowercase name once its number is the Total row
        const bonusName = nameParts.join(' ').capitalize();
        // A state never rests on color: the reached levels and the next ones are named
        const reached = indexes?.filter((level) => level < highestEmperorShowdown).map((level) => level + 1) ?? [];
        const next = indexes?.filter((level) => level >= highestEmperorShowdown).map((level) => level + 1) ?? [];
        return <ItemCard key={'upgrade-' + index} icon={icon ? `${icon}.png` : undefined} title={bonusName}>
          <ItemCard.Facts rows={[
            ['Total', realValue],
            ['Base', baseValue],
            ['Per level', cleanUnderscore(value)],
            ['Reached at', reached.join(', ') || 'None'],
            ['Next at', next.join(', ') || 'None']
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  </>
};

export default Emperor;

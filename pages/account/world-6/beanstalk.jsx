import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { addEquippedItems, findItemInInventory, getAllItems, mergeItemsByOwner } from '@parsers/items';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { createBreakdown, evaluateBreakdownNode, flatLines, sumGroup } from '@parsers/breakdown';
import ItemDisplay from '@components/common/ItemDisplay';
import { BEANSTALK_BREAKPOINTS, getBeanstalkFoods, getGoldenFoodMulti, getGoldenFoodBonus } from '@parsers/misc';
import Notice from '@components/common/Notice';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import Num from '@components/common/Num';

const Beanstalk = () => {
  const { state } = useContext(AppContext);
  const beanstalkData = state?.account?.sneaking?.beanstalkData;
  const sectionFailed = isSectionFailed(state?.account, 'sneaking');
  const beanstalkGoldenFoods = getBeanstalkFoods(beanstalkData);
  const unlocked = isJadeBonusUnlocked(state?.account, 'Gold_Food_Beanstalk');
  const findItem = (name) => {
    const equippedItems = addEquippedItems(state?.characters, true);
    const totalItems = getAllItems(state?.characters, state?.account)
    const totalOwnedItems = mergeItemsByOwner([...(totalItems || []), ...(equippedItems || [])]);
    return findItemInInventory(totalOwnedItems, name)
  };
  const allCharactersMulti = state?.characters?.map((character) => {
    const multi = getGoldenFoodMulti(character, state?.account, state?.characters);
    return {
      character,
      name: character?.name,
      bonus: multi?.value,
      breakdown: multi?.breakdown,
      value: formatNum(Math.max(0, 100 * ((multi?.value ?? 1) - 1)), 'pct')
    }
  }) ?? [];
  allCharactersMulti.sort((a, b) => a.bonus - b.bonus);
  // Sorted ascending, so the last entry is the best character. This page is account-wide and has no
  // character picker, so the per-food bonuses are shown for whoever gets the most out of them.
  const bestCharacter = allCharactersMulti.at(-1);
  const bestBonusText = formatNum(Math.max(0, 100 * ((bestCharacter?.bonus ?? 1) - 1)), 'pct');
  // Best character first, then its own sources in a second tab
  const charactersBreakdown = createBreakdown('Golden Food Bonus', bestBonusText,
    flatLines([...allCharactersMulti].reverse()
      .map(({ name, bonus, value }) => ({ name, value: bonus, formatted: value }))),
    { label: 'Characters', combine: 'list' });
  // The best character's tab totals as the tile reads (7.71K%), not the parser's raw percent text (7703.24)
  const totalBreakdowns = [charactersBreakdown,
    bestCharacter?.breakdown && { ...bestCharacter.breakdown, label: bestCharacter.name, totalValue: bestBonusText }];
  return <>
    <NextSeo
      title="Beanstalk | Idleon Toolbox"
      description="Keep track on your golden food bonuses on the beanstalk"
    />
    {sectionFailed ? <MissingData name={'the Beanstalk'} failed/> : !unlocked ? <Notice tone={'locked'} sx={{ mb: 2 }}>
      The beanstalk bonuses need Gold Food Beanstalk from the Jade Emporium.
    </Notice> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Total golden food bonus'} value={bestBonusText} breakdown={totalBreakdowns}
                breakdownTitle={'Total golden food bonus'}/>
    </PageSummary>
    <CardGrid size={'s'}>
      {beanstalkGoldenFoods?.map((item) => {
        const { displayName, rawName, rank } = item;
        const goldenFoods = findItem(displayName);
        // Storage is the account's chest, named like a place; characters keep their own spelling
        const ownedLines = flatLines(Object.entries(goldenFoods || {})
          .map(([playerName, { amount }]) => ({
            name: playerName === 'storage' ? 'Storage' : playerName, value: amount, formatted: formatNum(amount, 'whole')
          })));
        const total = evaluateBreakdownNode(sumGroup('Owned', ownedLines));
        // The card's Owned, its drawer's header and its rows all in the amount kind (2,218 opens 2,218)
        const breakdown = createBreakdown(cleanUnderscore(displayName), formatNum(total, 'whole'), ownedLines, { combine: 'sum' });
        // A guest has no ranks: rank 0's breakpoint, not "Maxed"
        const breakpoint = BEANSTALK_BREAKPOINTS?.[rank ?? 0];
        const owned = <Breakdown asValue data={breakdown}><Num value={total} whole/></Breakdown>;
        const sprite = <GameIcon src={`data/${rawName}.png`} size={32} alt={''}/>;
        return <ItemCard key={rawName} title={cleanUnderscore(displayName)} status={breakpoint ? undefined : 'maxed'}
                         icon={displayName && displayName !== 'ERROR'
                           ? <NoteTrigger note={<ItemDisplay {...item} character={bestCharacter?.character}
                                                             account={state?.account}
                                                             characters={state?.characters}
                                                             getGoldenFoodBonus={getGoldenFoodBonus}/>}
                                          label={`${cleanUnderscore(displayName)} details`}>{sprite}</NoteTrigger>
                           : sprite}>
          {breakpoint
            ? <ItemCard.Progress label={'Owned'} value={owned} max={<Num value={breakpoint} whole/>}
                                 percent={Math.min(100, (100 * (total ?? 0)) / breakpoint)}/>
            : <ItemCard.Facts rows={[['Owned', owned]]}/>}
        </ItemCard>;
      })}
    </CardGrid>
  </>
};

export default Beanstalk;

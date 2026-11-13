import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { gemShop } from '@website-data';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { gemCostToMax, gemItemRestock, isNewMeal, isUnlimitedGemItem, mealsLeftToUnlock } from '@parsers/gemShop';

// Keyed by `${categoryName}_${globalIndex}` - globalIndex is reused across categories
// (e.g. usables>Limited_Specials and past_limited_specials both use 87-94), so a flat
// globalIndex-only key would mistag items across categories.
const priorities = {
  bonuses_103: 'S',
  bonuses_106: 'S',
  bonuses_111: 'S',
  usables_63: 'S',
  usables_56: 'A',
  usables_58: 'A',
  usables_55: 'A',
  bonuses_104: 'A',
  usables_84: 'A',
  usables_59: 'A',
  bonuses_115: 'A',
  bonuses_120: 'A',
  bonuses_119: 'A',
  bonuses_129: 'A',
  bonuses_131: 'A',
  bonuses_133: 'A',
  bonuses_130: 'A',
  usables_72: 'B',
  usables_71: 'B',
  bonuses_105: 'B',
  bonuses_112: 'B',
  bonuses_117: 'B',
  bonuses_122: 'B',
  bonuses_57: 'C',
  bonuses_114: 'C',
  bonuses_118: 'C',
  bonuses_113: 'C',
  bonuses_125: 'C'
};

const PRIORITY_TIERS = ['S', 'A', 'B', 'C'];

// Items without a curated tier fall into 'Unranked' instead of no tier at all, so they
// stay reachable when a tier filter is selected instead of silently disappearing.
const getPriority = (categoryName, globalIndex) => priorities[`${categoryName}_${globalIndex}`] || 'Unranked';

const SHOP_TOOLBAR = { search: '', tier: 'all', hideMaxed: false };
const TIERS = [['all', 'All tiers'], ['S', 'S tier'], ['A', 'A tier'], ['B', 'B tier'], ['C', 'C tier'], ['Unranked', 'Unranked']];
const TIER_NAME = { S: 'S tier', A: 'A tier', B: 'B tier', C: 'C tier' };
const PAST_CATEGORY = 'past_limited_specials';
const isRealItem = ({ rawName, displayName }) => rawName !== 'Blank' && displayName !== 'NAME_OF_ITEM';
// Every digit, as the game and General print them; a card's cost reads the same way beside it
const gemCount = (value) => formatGame(value, 'Save.Gems', { whole: true });
const itemTitle = (displayName) => titleCaseName(cleanUnderscore(displayName));

const GemShop = () => {
  const { state } = useContext(AppContext);
  const failed = isSectionFailed(state?.account, 'gemShopPurchases');
  // Gems come straight from the save, so only a whole-parse failure leaves them unknown: a card then says the cost and no "need"
  const gems = state?.account?.currencies?.gems;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('gem-shop', SHOP_TOOLBAR);
  const hideMaxed = !failed && toolbar.hideMaxed;
  // Past limited specials reuse the current items' indices, so the save can't say which of them were bought
  const boughtOf = (category, globalIndex) => (failed || category === PAST_CATEGORY
    ? null
    : state?.account?.gemShopPurchases?.[globalIndex] ?? 0);
  const mealsLeft = failed ? null : mealsLeftToUnlock(state?.account);
  // What a card says about its purchases: New Meal's cap is the meals still locked, a restocking item's max is one day's
  // or week's stock (sold out, never maxed), and an unlimited item has no count at all
  const purchaseOf = ({ category, globalIndex, maxPurchases }) => {
    const bought = boughtOf(category, globalIndex);
    if (bought == null) return { bought };
    if (isNewMeal(globalIndex)) return { bought, mealsLeft, maxed: mealsLeft === 0 };
    if (isUnlimitedGemItem(maxPurchases)) return { bought, unlimited: true };
    const restock = gemItemRestock(globalIndex);
    if (restock) return { bought, restock, soldOut: bought >= maxPurchases };
    return { bought, permanent: true, maxed: bought >= maxPurchases };
  };

  const allItems = (gemShop ?? []).flatMap(({ name, sections }) => Object.entries(sections ?? {})
    .flatMap(([sectionName, items]) => (items ?? []).filter(isRealItem).map((item) => ({ ...item, category: name, sectionName }))));
  const matchesSearch = ({ displayName, desc, sectionName }) => {
    const search = `${toolbar.search ?? ''}`.trim().toLowerCase();
    if (!search) return true;
    return [itemTitle(displayName), cleanUnderscore(desc ?? ''), cleanUnderscore(sectionName.capitalize())]
      .some((text) => text.toLowerCase().includes(search));
  };
  const isMaxed = (item) => Boolean(purchaseOf(item).maxed);
  const isVisible = (item) => (toolbar.tier === 'all' || getPriority(item.category, item.globalIndex) === toolbar.tier)
    && !(hideMaxed && isMaxed(item)) && matchesSearch(item);
  const countOf = (tier) => allItems.filter((item) => tier === 'all' || getPriority(item.category, item.globalIndex) === tier).length;
  const shownCount = allItems.filter(isVisible).length;
  // Unlimited and restocking items have no cap to reach; a globalIndex two rows share counts once
  const permanentItems = [...new Map(allItems.filter((item) => purchaseOf(item).permanent)
    .map((item) => [item.globalIndex, item])).values()];
  const permanentBought = permanentItems.reduce((sum, item) => sum + Math.min(purchaseOf(item).bought, item.maxPurchases), 0);
  const permanentTotal = permanentItems.reduce((sum, { maxPurchases }) => sum + maxPurchases, 0);
  const gemsToMax = permanentItems.reduce((sum, item) =>
    sum + gemCostToMax(item.cost, item.costIncrement || 0, purchaseOf(item).bought, item.maxPurchases), 0);

  const itemCard = (item, index) => {
    const { category, globalIndex, rawName, displayName, desc, cost, maxPurchases, costIncrement } = item;
    const { bought, maxed, soldOut, restock, permanent, mealsLeft: left } = purchaseOf(item);
    // A sold-out item's next one is sold after the restock, which sets its count back to 0
    const nextCost = cost + (soldOut ? 0 : bought ?? 0) * (costIncrement || 0);
    // Cost to max: up to the cap, or for New Meal up to the last locked meal
    const cap = permanent ? maxPurchases : left != null ? bought + left : null;
    const status = maxed ? 'maxed' : soldOut ? 'info' : undefined;
    const factRow = left != null
      ? ['Meals left to unlock', formatNum(left, 'whole')]
      : permanent || restock
        ? ['Bought', `${formatNum(bought, 'whole')} / ${formatNum(maxPurchases, 'whole')}`]
        : ['Cost', formatNum(cost, 'whole')];
    return <ItemCard key={`${category}-${globalIndex}-${rawName}-${index}`}
                     icon={rawName?.includes(';') ? undefined : `data/${rawName}.png`}
                     title={itemTitle(displayName)} meta={TIER_NAME[getPriority(category, globalIndex)]}
                     status={status} statusLabel={soldOut ? `Sold out ${restock === 'day' ? 'today' : 'this week'}` : undefined}
                     footer={bought == null ? null : <ItemCard.Cost icon={'data/PremiumGem.png'} iconAlt={'Gems'} need={nextCost}
                                                                    have={gems} format={gemCount}/>}>
      <ItemCard.Facts rows={[factRow, cap != null && !maxed && cap - bought > 1
        ? ['Cost to max', formatNum(gemCostToMax(cost, costIncrement || 0, bought, cap), 'whole')]
        : null]}/>
      <ItemCard.Desc text={cleanUnderscore(desc ?? '')}/>
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Gem Shop | Idleon Toolbox"
      description="Browse all gem shop purchases, upgrade bonuses, and premium currency spending in Legends of Idleon"
    />
    {failed ? <MissingData name={'Gem Shop'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Gems'} icon={'data/PremiumGem.png'} value={gems == null ? '-' : gemCount(gems)}/>
      <StatTile label={'Permanent upgrades bought'}
                value={failed ? '-' : `${formatNum(permanentBought, 'whole')} / ${formatNum(permanentTotal, 'whole')}`}/>
      <StatTile label={'Gems to max permanent upgrades'} icon={'data/PremiumGem.png'} value={failed ? '-' : gemCount(gemsToMax)}/>
    </PageSummary>
    <Toolbar state={toolbar} defaults={SHOP_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={allItems.length} shown={shownCount} noun={'items'}>
      <Toolbar.Search placeholder={'Search items'}/>
      <Toolbar.Show name={'tier'} options={TIERS.map(([key, label]) => [key, label, countOf(key)])}/>
      {failed ? null : <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>}
    </Toolbar>
    {(gemShop ?? []).map(({ name, sections }) => {
      const visibleSections = Object.entries(sections ?? {})
        .map(([sectionName, items]) => [sectionName, (items ?? []).filter(isRealItem)
          .map((item) => ({ ...item, category: name, sectionName })).filter(isVisible)])
        .filter(([, items]) => items.length);
      // A category with nothing to show draws no heading over nothing
      if (!visibleSections.length) return null;
      return <Stack key={name} gap={2} sx={{ mt: 3 }}>
        <Typography variant={'sectionTitle'} component={'h2'}>{cleanUnderscore(name).capitalize()}</Typography>
        {visibleSections.map(([sectionName, items], sectionIndex) => <Stack key={sectionName} gap={1}>
          <Stack direction={'row'} alignItems={'baseline'} columnGap={1} flexWrap={'wrap'}>
            <Typography variant={'groupLabel'} component={'h3'}>{cleanUnderscore(sectionName.capitalize())}</Typography>
            {name === PAST_CATEGORY && sectionIndex === 0
              ? <Typography variant={'body2'} color={'text.secondary'}>The save doesn't say which past specials you bought.</Typography>
              : null}
          </Stack>
          {/* A card keeps what a purchase is weighed by: its tier, how many are bought, the next price and what it does
              (names like "Just One, Please" don't say), and the cost to max where more than one is left. */}
          <CardGrid size={'m'}>{items.map(itemCard)}</CardGrid>
        </Stack>)}
      </Stack>;
    })}
  </>
};
export default GemShop;

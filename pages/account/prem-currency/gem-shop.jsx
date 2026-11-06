import { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { gemShop } from '@website-data';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

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

const calculateTotalCostToMax = (baseCost, costIncrement, currentPurchases, maxPurchases) => {
  let totalCost = 0;
  for (let i = currentPurchases; i < maxPurchases; i++) {
    totalCost += baseCost + (i * costIncrement);
  }
  return totalCost;
};

const SHOP_TOOLBAR = { search: '', tier: 'all', hideMaxed: false };
const TIERS = [['all', 'All tiers'], ['S', 'S tier'], ['A', 'A tier'], ['B', 'B tier'], ['C', 'C tier'], ['Unranked', 'Unranked']];
const TIER_NAME = { S: 'S tier', A: 'A tier', B: 'B tier', C: 'C tier' };
const PAST_CATEGORY = 'past_limited_specials';
const isRealItem = ({ rawName, displayName }) => rawName !== 'Blank' && displayName !== 'NAME_OF_ITEM';
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

  const allItems = (gemShop ?? []).flatMap(({ name, sections }) => Object.entries(sections ?? {})
    .flatMap(([sectionName, items]) => (items ?? []).filter(isRealItem).map((item) => ({ ...item, category: name, sectionName }))));
  const matchesSearch = ({ displayName, desc, sectionName }) => {
    const search = `${toolbar.search ?? ''}`.trim().toLowerCase();
    if (!search) return true;
    return [itemTitle(displayName), cleanUnderscore(desc ?? ''), cleanUnderscore(sectionName.capitalize())]
      .some((text) => text.toLowerCase().includes(search));
  };
  const isMaxed = ({ category, globalIndex, maxPurchases }) => {
    const bought = boughtOf(category, globalIndex);
    return bought != null && bought >= maxPurchases;
  };
  const isVisible = (item) => (toolbar.tier === 'all' || getPriority(item.category, item.globalIndex) === toolbar.tier)
    && !(hideMaxed && isMaxed(item)) && matchesSearch(item);
  const countOf = (tier) => allItems.filter((item) => tier === 'all' || getPriority(item.category, item.globalIndex) === tier).length;
  const shownCount = allItems.filter(isVisible).length;

  const itemCard = (item, index) => {
    const { category, globalIndex, rawName, displayName, desc, cost, maxPurchases, costIncrement } = item;
    const bought = boughtOf(category, globalIndex);
    const maxed = bought != null && bought >= maxPurchases;
    const nextCost = cost + (bought ?? 0) * (costIncrement || 0);
    return <ItemCard key={`${category}-${globalIndex}-${rawName}-${index}`}
                     icon={rawName?.includes(';') ? undefined : `data/${rawName}.png`}
                     title={itemTitle(displayName)} meta={TIER_NAME[getPriority(category, globalIndex)]}
                     status={maxed ? 'maxed' : undefined}
                     footer={bought == null ? null : <ItemCard.Cost icon={'data/PremiumGem.png'} iconAlt={'Gems'} need={nextCost}
                                                                    have={gems} format={(value) => formatNum(value, 'whole')}/>}>
      <ItemCard.Desc text={cleanUnderscore(desc ?? '')}/>
      <ItemCard.Facts rows={[
        bought == null ? ['Cost', formatNum(cost, 'whole')] : ['Bought', `${formatNum(bought, 'whole')} / ${formatNum(maxPurchases, 'whole')}`],
        bought != null && !maxed && maxPurchases - bought > 1
          ? ['Cost to max', formatNum(calculateTotalCostToMax(cost, costIncrement || 0, bought, maxPurchases), 'whole')]
          : null
      ]}/>
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Gem Shop | Idleon Toolbox"
      description="Browse all gem shop purchases, upgrade bonuses, and premium currency spending in Legends of Idleon"
    />
    {failed ? <MissingData name={'Gem Shop'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Gems'} icon={'data/PremiumGem.png'} value={gems == null ? '-' : formatNum(gems)}/>
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
          <CardGrid size={'m'}>{items.map(itemCard)}</CardGrid>
        </Stack>)}
      </Stack>;
    })}
  </>
};
export default GemShop;

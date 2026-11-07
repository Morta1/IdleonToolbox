import { Box, Stack, Typography } from '@mui/material';
import StatusText from '@components/common/StatusText';
import { cleanUnderscore, formatDuration, formatNum } from '@utility/helpers';
import { formatGame, mealBonusText } from '@utility/gameNotation';
import Timer from 'components/common/Timer';
import React from 'react';
import {
  calcMealTime,
  calcTimeToNextLevel,
  getMealBonus,
  getMealLevelCost,
  maxNumberOfSpiceClicks,
  spicesNames
} from '@parsers/world-4/cooking';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import MealIcon from 'components/common/MealIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import IconTile from '@components/common/cards/IconTile';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import Num from '@components/common/Num';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const SPICE_COST = 'CookingR.CookingUpgSpiceCostQty';
const MEAL_COST = 'CookingR.CookingMenuMealCosts';
const KITCHENS_TOOLBAR = { details: false };

const hoursText = (hours) => (Number.isFinite(hours) ? formatDuration(hours * 3600) : 'Never');

// A meal being cooked: its bonus in the game's own fill, its next level, its progress, and the diamond plate's time for
// the Details pill
const mealProgress = (meal, { totalMealSpeed, achievements, equinoxUpgrades, account }) => {
  const timeToDiamond = calcMealTime(11, meal, totalMealSpeed, achievements, equinoxUpgrades, account);
  const levelCost = getMealLevelCost(meal?.level, achievements, account, equinoxUpgrades);
  const diamondCost = (11 - meal?.level) * levelCost;
  const showDiamond = meal?.level < 11 && levelCost !== diamondCost;
  const isReady = meal?.amount >= levelCost;
  const timeTillNextLevel = isReady ? 0 : calcTimeToNextLevel(levelCost - meal?.amount, meal?.cookReq, totalMealSpeed);
  const realEffect = getMealBonus(account, meal).value;
  const target = showDiamond ? diamondCost : levelCost;
  return {
    body: <>
      <ItemCard.Desc text={meal?.effect?.replace('{', mealBonusText(realEffect))}/>
      <ItemCard.Facts rows={[
        ['Next level', isReady ? <StatusText key={'ready'} status={'ready'}/> : hoursText(timeTillNextLevel)]
      ]}/>
      <ItemCard.Progress label={showDiamond ? 'Progress to Lv 11' : 'Progress'}
                         percent={target > 0 ? Math.min(100, 100 * (meal?.amount ?? 0) / target) : 100}
                         value={<Num value={meal?.amount ?? 0} game={MEAL_COST} whole/>} max={<Num value={target ?? 0} game={MEAL_COST} whole/>}/>
    </>,
    more: showDiamond ? <ItemCard.Facts rows={[['Diamond plate', hoursText(timeToDiamond)]]}/> : null
  };
};

const Kitchens = ({
                    spices,
                    kitchens,
                    meals,
                    totalMealSpeed,
                    lastUpdated,
                    achievements,
                    equinoxUpgrades,
                    account,
                    sectionFailed,
                    kitchensFailed
                  }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('cooking-kitchens', KITCHENS_TOOLBAR);
  const calcTotals = (list) => {
    return list?.reduce((res, kitchen) => {
      const isCooking = kitchen?.status === 2;
      if (!isCooking) return res;
      const { meal } = kitchen;
      return {
        ...res,
        [meal?.rawName]: { total: (res[meal?.rawName]?.total ?? 0) + (kitchen?.mealSpeed / kitchen?.meal?.cookReq), ...meal }
      }
    }, {})
  }
  const totals = Object.entries(calcTotals(kitchens) ?? {});
  const progressOptions = { totalMealSpeed, achievements, equinoxUpgrades, account };
  const ownedSpice = (rawName) => spices?.available?.find((spice) => spice?.rawName === rawName)?.amount ?? 0;
  const builtKitchens = kitchens?.filter(Boolean) ?? [];

  const getRecipeTime = (possibleMeals) => {
    if (!possibleMeals) return 0;
    const lastMeal = possibleMeals[possibleMeals.length - 1];
    if (lastMeal?.index < meals?.length) {
      return 2 * lastMeal?.cookReq
    }
    return 2 * 5000000000;
  }

  const getSpiceForUpgrade = (kitchenIndex, upgradeType) => {
    return Math.floor(2 * kitchenIndex + upgradeType);
  }

  // What an upgrade's next level costs against the spice the account owns, named by the upgrade it buys
  const upgradeCost = (label, spice, name, cost) => <Stack key={label} direction={'row'} alignItems={'center'}
                                                           justifyContent={'space-between'} columnGap={1.5}
                                                           flexWrap={'wrap'}>
    <Typography variant={'body2'} color={'text.secondary'}>{label}</Typography>
    <ItemCard.Cost icon={`data/${spice}.png`} iconAlt={name} need={cost ?? 0} have={ownedSpice(spice)} game={SPICE_COST}/>
  </Stack>;

  // A recipe's spices and the meals they can make (greyed until found): the Details pill's part of its card, under the
  // recipe's progress
  const recipeIngredients = (kitchen) => {
    const usedSpices = kitchen?.spices?.filter((spice) => spice !== -1) ?? [];
    if (!usedSpices.length && !kitchen?.possibleMeals?.length) return null;
    return <Stack gap={1}>
      {usedSpices.length ? <>
        <Typography variant={'body2'} color={'text.secondary'}>Spices</Typography>
        <CardGrid size={'icon'} fill>
          {usedSpices.map((spice, index) => <IconTile key={`${spice}-${index}`} icon={`data/CookingSpice${spice}.png`}
                                                      alt={spicesNames[spice]} details={`${spicesNames[spice] ?? 'Spice'} spice`}/>)}
        </CardGrid>
      </> : null}
      {kitchen?.possibleMeals?.length ? <>
        <Typography variant={'body2'} color={'text.secondary'}>Possible meals</Typography>
        <CardGrid size={'icon'} fill>
          {kitchen.possibleMeals.map((food, index) => {
            const name = cleanUnderscore(meals?.[food?.index]?.name ?? food?.rawName);
            const found = (meals?.[food?.index]?.level ?? 0) > 0;
            return <IconTile key={`possible-${food?.rawName}-${index}`} icon={`data/${food?.rawName}.png`} alt={name}
                             status={found ? undefined : 'missing'} details={found ? name : `${name}: not found yet`}/>;
          })}
        </CardGrid>
      </> : null}
    </Stack>;
  };

  // A kitchen making a recipe: its progress and when it's done
  const recipeSection = (kitchen, recipeTime, timeToFinish) => <ItemCard.Section label={'Recipe'}>
    <ItemCard.Progress label={'Progress'}
                       percent={recipeTime > 0 ? Math.min(100, 100 * (kitchen?.currentProgress ?? 0) / recipeTime) : 0}
                       value={<Num value={kitchen?.currentProgress ?? 0} game={MEAL_COST} whole/>}
                       max={<Num value={recipeTime} game={MEAL_COST} whole/>}/>
    <ItemCard.Facts rows={[['Done in', <Timer key={'done'} variant={'body2'} placeholder={<StatusText status={'ready'}/>}
                                              type={'countdown'} date={new Date().getTime() + (timeToFinish * 1000 * 3600)}
                                              lastUpdated={lastUpdated}/>]]}/>
  </ItemCard.Section>;

  return (
    <>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={2}>
        <StatTile label={'Spice claims'}
                  value={sectionFailed ? '-' : `${formatNum(spices?.numberOfClaims ?? 0)} / ${formatNum(maxNumberOfSpiceClicks)}`}/>
      </Stack>
      {spices?.available?.length ? <CardGrid size={'icon'} sx={{ mb: 3 }}>
        {spices.available.map((spice, index) => <IconTile key={`${spice?.rawName}-${index}`} icon={`data/${spice?.rawName}.png`}
                                                          alt={`${spice?.name} spice`}
                                                          value={formatGame(spice?.amount ?? 0, SPICE_COST, { whole: true })}
                                                          details={`${spice?.name} spice: ${formatNum(Number(spice?.amount ?? 0), 'exact')}`}/>)}
      </CardGrid> : null}
      {/* In a failed section the page's note says why there are none */}
      {!builtKitchens.length ? (kitchensFailed ? null
        : <Notice tone={'info'}>Kitchens show here once you build your first one in World 4.</Notice>) : <Box>
        <Toolbar state={toolbar} defaults={KITCHENS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                 total={builtKitchens.length} shown={builtKitchens.length} noun={'kitchens'}>
          <Toolbar.Filter name={'details'} label={'Details'} display/>
        </Toolbar>
        {totals.length ? <Stack gap={1} mb={3}>
          <Typography variant={'sectionTitle'} component={'h2'}>Totals</Typography>
          <CardGrid size={'m'} details={toolbar?.details}>
            {totals.map(([foodName, meal], index) => {
              const { body, more } = mealProgress(meal, progressOptions);
              return <ItemCard key={`${foodName}-${index}`} icon={<MealIcon rawName={foodName} plateLevel={meal?.level} small/>}
                               title={cleanUnderscore(meal?.name)} meta={formatNum(meal?.total ?? 0, 'rate')} more={more}>
                {body}
              </ItemCard>;
            })}
          </CardGrid>
        </Stack> : null}
        {/* A card leads with what its kitchen does now: meal speed while it cooks, fire speed and luck while it makes a
            recipe. Its upgrade costs stay; the other stats and a recipe's spices show with the Details pill. */}
        <CardGrid size={'l'} details={toolbar?.details}>
          {builtKitchens.map((kitchen, index) => {
            const kitchenIndex = kitchen?.kitchenIndex ?? index;
            const isRecipe = kitchen?.status >= 3;
            const recipeTime = getRecipeTime(kitchen?.possibleMeals);
            const timeToFinish = (recipeTime - kitchen?.currentProgress) / kitchen?.fireSpeed;
            const [firstSpiceIndex, secondSpiceIndex, thirdSpiceIndex] = [0, 1, 2]
              .map((ind) => getSpiceForUpgrade(kitchenIndex, ind));
            const luckSpice = thirdSpiceIndex >= 21 ? 'CookingSpiceNA' : `CookingSpice${thirdSpiceIndex}`;
            const speedText = `${formatGame(kitchen?.mealSpeed ?? 0, 'CookingR.CookingSPEED')}/hr`;
            const fireText = `${formatGame(kitchen?.fireSpeed ?? 0, 'CookingR.CookingFIRE')}/hr`;
            const speedRow = [`Speed Lv ${formatNum(kitchen?.speedLv ?? 0)}`, kitchen?.mealSpeedBreakdown
              ? <Breakdown key={'speed'} asValue title={`Kitchen ${kitchenIndex + 1} speed`}
                           data={{ ...kitchen.mealSpeedBreakdown, totalValue: speedText }}>{speedText}</Breakdown>
              : speedText];
            const fireRow = [`Fire Lv ${formatNum(kitchen?.fireLv ?? 0)}`, kitchen?.fireSpeedBreakdown
              ? <Breakdown key={'fire'} asValue title={`Kitchen ${kitchenIndex + 1} fire`}
                           data={{ ...kitchen.fireSpeedBreakdown, totalValue: fireText }}>{fireText}</Breakdown>
              : fireText];
            const luckRow = [`Luck Lv ${formatNum(kitchen?.luckLv ?? 0)}`, formatNum(kitchen?.mealLuck ?? 1, 'mult')];
            const mealsPerHourRow = ['Meals per hour', formatNum((kitchen?.mealSpeed ?? 0) / (kitchen?.meal?.cookReq || 1), 'rate')];
            return <ItemCard key={`kitchen-${kitchenIndex}`} title={`Kitchen ${kitchenIndex + 1}`}
                             meta={isRecipe ? 'Making a recipe' : cleanUnderscore(kitchen?.meal?.name)}
                             more={<>
                               {isRecipe ? recipeIngredients(kitchen) : null}
                               <ItemCard.Section>
                                 <ItemCard.Facts rows={isRecipe ? [speedRow] : [fireRow, luckRow]}/>
                               </ItemCard.Section>
                             </>}>
              <ItemCard.Facts rows={isRecipe ? [fireRow, luckRow] : [speedRow, mealsPerHourRow]}/>
              <ItemCard.Section label={'Upgrade costs'}>
                {upgradeCost('Speed', `CookingSpice${firstSpiceIndex}`, spicesNames[firstSpiceIndex], kitchen?.speedCost)}
                {upgradeCost('Fire', `CookingSpice${secondSpiceIndex}`, spicesNames[secondSpiceIndex], kitchen?.fireCost)}
                {upgradeCost('Luck', luckSpice, thirdSpiceIndex >= 20 ? 'Unknown spice' : spicesNames[thirdSpiceIndex], kitchen?.luckCost)}
              </ItemCard.Section>
              {isRecipe ? recipeSection(kitchen, recipeTime, timeToFinish) : null}
            </ItemCard>
          })}
        </CardGrid>
      </Box>}
    </>
  );
};

export default Kitchens;

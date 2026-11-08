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

// The upgrades' table: the stat and its level (it may wrap on a phone), what it gives, then the cost at the right edge.
// A row's cells start together, so a cost's "need" line hangs under its cost alone; the words take the cost's 24 px
// sprite line, so the three sit on one line.
const UPGRADES_SX = {
  display: 'grid', gridTemplateColumns: 'auto auto 1fr', columnGap: 1.5, rowGap: 1, alignItems: 'start'
};
const COST_CELL_SX = { justifySelf: 'end' };
const UPGRADE_WORDS_SX = { lineHeight: '24px' };

const hoursText = (hours) => (Number.isFinite(hours) ? formatDuration(hours * 3600) : 'Never');

// A meal being cooked, all kitchens together, as a tile beside the spice claims: the meals an hour and when its next level
// lands, with its bonus in the game's own fill and its progress (to the next level, or to the diamond plate with its
// time) in the tile's note. A card each left one meal alone in a row of four under a Totals heading, and a Panel of them
// read as one more kitchen in the kitchens' grid.
const mealTile = (foodName, meal, { totalMealSpeed, achievements, equinoxUpgrades, account }) => {
  const timeToDiamond = calcMealTime(11, meal, totalMealSpeed, achievements, equinoxUpgrades, account);
  const levelCost = getMealLevelCost(meal?.level, achievements, account, equinoxUpgrades);
  const diamondCost = (11 - meal?.level) * levelCost;
  const showDiamond = meal?.level < 11 && levelCost !== diamondCost;
  const isReady = meal?.amount >= levelCost;
  const timeTillNextLevel = isReady ? 0 : calcTimeToNextLevel(levelCost - meal?.amount, meal?.cookReq, totalMealSpeed);
  const realEffect = getMealBonus(account, meal).value;
  const target = showDiamond ? diamondCost : levelCost;
  const name = cleanUnderscore(meal?.name);
  return <StatTile key={foodName} icon={`data/${foodName}.png`} label={`${name}, all kitchens`}
                   value={`${formatNum(meal?.total ?? 0)} meals/hr`}
                   sub={isReady ? 'Next level ready' : `Next Lv in ${hoursText(timeTillNextLevel)}`}
                   info={<Stack gap={1}>
                     <Typography variant={'body2'}>{cleanUnderscore(meal?.effect?.replace('{', mealBonusText(realEffect)) ?? '')}</Typography>
                     <ItemCard.Progress label={showDiamond ? 'Progress to Lv 11' : 'Progress'}
                                        percent={target > 0 ? Math.min(100, 100 * (meal?.amount ?? 0) / target) : 100}
                                        value={<Num value={meal?.amount ?? 0} game={MEAL_COST} whole/>}
                                        max={<Num value={target ?? 0} game={MEAL_COST} whole/>}/>
                     {showDiamond ? <ItemCard.Facts rows={[['Diamond plate', hoursText(timeToDiamond)]]}/> : null}
                   </Stack>}/>;
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
  const makingRecipe = builtKitchens.some((kitchen) => kitchen?.status >= 3);

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

  // An upgrade as a row of a small table: its level, what it gives now, and its next level's cost against the spice the
  // account owns, each in its own column, so the three line up. A cost short of spice keeps its "need" line under it,
  // in its column: wrapped under the stat, a short cost sat offset from the others.
  const upgradeRow = (label, level, rate, spice, name, cost) => <React.Fragment key={label}>
    <Typography variant={'body2'} color={'text.secondary'} component={'div'} sx={UPGRADE_WORDS_SX}>{`${label} Lv ${formatNum(level ?? 0)}`}</Typography>
    <Typography variant={'body2'} component={'div'} sx={[UPGRADE_WORDS_SX, { fontWeight: 500, whiteSpace: 'nowrap' }]}>{rate}</Typography>
    <Box sx={COST_CELL_SX}>
      <ItemCard.Cost icon={`data/${spice}.png`} iconAlt={name} need={cost ?? 0} have={ownedSpice(spice)} game={SPICE_COST} needBelow/>
    </Box>
  </React.Fragment>;

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
        {totals.map(([foodName, meal]) => mealTile(foodName, meal, progressOptions))}
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
        {/* The Details pill opens a recipe's spices and the meals it can make: a bar with no recipe has nothing to open */}
        {makingRecipe ? <Toolbar state={toolbar} defaults={KITCHENS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                                 total={builtKitchens.length} shown={builtKitchens.length} noun={'kitchens'}>
          <Toolbar.Filter name={'details'} label={'Details'} display/>
        </Toolbar> : null}
        {/* A card leads with what its kitchen does now (its meal and the meals an hour, or its recipe), then speed, fire
            and luck a line each with the next level's cost; a recipe's spices show with the Details pill. */}
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
            const speed = kitchen?.mealSpeedBreakdown
              ? <Breakdown asValue title={`Kitchen ${kitchenIndex + 1} speed`}
                           data={{ ...kitchen.mealSpeedBreakdown, totalValue: speedText }}>{speedText}</Breakdown>
              : speedText;
            const fire = kitchen?.fireSpeedBreakdown
              ? <Breakdown asValue title={`Kitchen ${kitchenIndex + 1} fire`}
                           data={{ ...kitchen.fireSpeedBreakdown, totalValue: fireText }}>{fireText}</Breakdown>
              : fireText;
            const mealsPerHour = `${formatNum((kitchen?.mealSpeed ?? 0) / (kitchen?.meal?.cookReq || 1))} meals/hr`;
            return <ItemCard key={`kitchen-${kitchenIndex}`} title={`Kitchen ${kitchenIndex + 1}`}
                             meta={isRecipe ? 'Making a recipe' : `${cleanUnderscore(kitchen?.meal?.name)} · ${mealsPerHour}`}
                             more={isRecipe ? recipeIngredients(kitchen) : null}>
              <Box sx={UPGRADES_SX}>
                {upgradeRow('Speed', kitchen?.speedLv, speed, `CookingSpice${firstSpiceIndex}`, spicesNames[firstSpiceIndex], kitchen?.speedCost)}
                {upgradeRow('Fire', kitchen?.fireLv, fire, `CookingSpice${secondSpiceIndex}`, spicesNames[secondSpiceIndex], kitchen?.fireCost)}
                {upgradeRow('Luck', kitchen?.luckLv, formatNum(kitchen?.mealLuck ?? 1, 'mult'), luckSpice,
                  thirdSpiceIndex >= 20 ? 'Unknown spice' : spicesNames[thirdSpiceIndex], kitchen?.luckCost)}
              </Box>
              {isRecipe ? recipeSection(kitchen, recipeTime, timeToFinish) : null}
            </ItemCard>
          })}
        </CardGrid>
      </Box>}
    </>
  );
};

export default Kitchens;

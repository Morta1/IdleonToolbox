import React, { useEffect, useState } from 'react';
import {
  calcMealTime,
  calcTimeToNextLevel,
  getMealLevelCost,
  getNoMealLeftBehindLevels,
  getNoMealLeftBehindQueue,
  getRibbonBonus,
  NO_MEAL_LEFT_BEHIND_MIN_LEVEL
} from '@parsers/world-4/cooking';
import {
  cleanUnderscore,
  commaNotation,
  getTimeAsDays,
  growth,
  kFormatter,
  notateNumber,
  numberWithCommas,
  prefix
} from 'utility/helpers';
import {
  Button,
  Card,
  CardContent,
  Divider,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useLocalStorage } from '@mantine/hooks';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import HtmlTooltip from 'components/Tooltip';
import Timer from 'components/common/Timer';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuItem from '@mui/material/MenuItem';
import { getJewelBonus, getLabBonus } from '@parsers/world-4/lab';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { isCompanionBonusActive } from '@parsers/misc';

const maxTimeValue = 8.64e15;

const breakpoints = [-1, 0, -2, -3, 11, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190,
  200];
const Meals = ({ account, characters, meals, totalMealSpeed, mealMaxLevel, achievements, lab, equinoxUpgrades }) => {
  const [filters, setFilters] = useState(() => []);
  const [localMeals, setLocalMeals] = useState();
  const [bestSpeedMeal, setBestSpeedMeal] = useState([]);
  const [mealSpeed, setMealSpeed] = useState(totalMealSpeed);
  const [sortBy, setSortBy] = useState(breakpoints[0]);
  const [foodLust, setFoodLust] = useState(account?.equinox?.upgrades?.find(({ name }) => name === 'Food_Lust')?.bonus)
  const [localEquinoxUpgrades, setLocalEquinoxUpgrades] = useState(account?.equinox?.upgrades);
  // 0 means "no limit" - the slider sitting at its maximum.
  const [mealLimit, setMealLimit] = useLocalStorage({
    key: 'meals-filter-limit',
    defaultValue: 0
  });
  const [procCount, setProcCount] = useLocalStorage({
    key: 'meals-nmlb-procs',
    defaultValue: 15
  });
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(lab?.jewels, 16, spelunkerObolMulti);
  const allPurpleActive = lab?.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
  const realAmethystRhinestone = getJewelBonus(lab?.jewels, 0, spelunkerObolMulti) * allPurpleActive;
  const amethystRhinestone = 4.5;
  const getNoMealLeftBehind = (baseMeals, mealMaxLevel, returnArray) => {
    const bonusActivated = getNoMealLeftBehindLevels(account) > 0;
    if (bonusActivated) {
      const mealToUpgrade = 1;
      const sortedMeals = baseMeals.filter(meal => meal.level >= NO_MEAL_LEFT_BEHIND_MIN_LEVEL && meal.level < mealMaxLevel).sort((meal1, meal2) => {
        if (meal1.level === meal2.level) {
          return meal1.index > meal2.index ? -1 : 1
        }
        return meal1.level < meal2.level ? -1 : 1
      });
      if (returnArray) {
        return sortedMeals;
      }
      return sortedMeals.slice(0, mealToUpgrade).at(0);
    }
    return baseMeals;
  }
  const noMealLeftBehind = getNoMealLeftBehind(meals, mealMaxLevel);
  const sortMealsBy = (meals, index, level = 0) => {
    if (index === 0) return defaultMeals;
    const mealsCopy = [...defaultMeals];
    if (index === -3) {
      mealsCopy.sort((a, b) => {
        const aRibbonIndex = account?.grimoire?.ribbons?.[28 + a.index];
        const bRibbonIndex = account?.grimoire?.ribbons?.[28 + b.index];
        // Handle undefined values
        if (aRibbonIndex === 0 && bRibbonIndex === 0) {
          return 0; // Both are undefined, no change in order
        }
        if (aRibbonIndex === 0) {
          return 1; // a goes after b
        }
        if (bRibbonIndex === 0) {
          return -1; // b goes after a
        }
        return aRibbonIndex - bRibbonIndex;
      });
      return mealsCopy;
    }
    mealsCopy.sort((a, b) => {
      if (level !== 0) {
        if (a.level >= level) {
          return 1;
        }
        else if (b.level >= level) {
          return -1;
        }
      }
      const aSortIndex = a?.breakpointTimes?.[index]?.timeToBp;
      const bSortIndex = b?.breakpointTimes?.[index]?.timeToBp;
      return aSortIndex - bSortIndex;
    });
    return mealsCopy;
  }


  const getBestMealsSpeedContribute = (meals) => {
    let speedMeals = meals.filter((meal) => (meal?.stat === 'Mcook' || meal?.stat === 'KitchenEff' || meal?.stat === 'zMealFarm') && meal?.level < mealMaxLevel);
    speedMeals = speedMeals.map((meal) => {
      const { level, baseStat, shinyMulti, timeTillNextLevel, index, cookingMasteryNode } = meal;
      const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
      const ribbonBonus = getRibbonBonus(account, account?.grimoire?.ribbons?.[28 + index]);
      const nodeMulti = cookingMasteryNode?.multi ?? 1;
      const base = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * ribbonBonus * nodeMulti * baseStat;
      const currentBonus = base * level;
      const nextLevelBonus = base * (level + 1);
      return {
        ...meal,
        currentLevelBonus: notateNumber(currentBonus, 'MultiplierInfo'),
        nextLevelBonus: notateNumber(nextLevelBonus, 'MultiplierInfo'),
        bonusDiff: nextLevelBonus - currentBonus,
        diff: (nextLevelBonus - currentBonus) / timeTillNextLevel
      }
    });
    speedMeals.sort((a, b) => b.diff - a.diff);
    return speedMeals;
  }


  const getHighestOverflowingLadle = () => {
    const bloodBerserkers = characters?.filter((character) => checkCharClass(character?.class, CLASSES.Blood_Berserker));
    return bloodBerserkers?.reduce((res, { talents, name }) => {
      const overflowingLadle = talents?.[3]?.orderedTalents.find((talent) => talent?.name === 'OVERFLOWING_LADLE');
      const lv = overflowingLadle?.level > overflowingLadle?.maxLevel
        ? overflowingLadle?.level
        : overflowingLadle?.maxLevel;
      const bonus = growth(overflowingLadle?.funcX, lv, overflowingLadle?.x1, overflowingLadle?.x2, false);
      if (bonus > res.value) {
        return { value: bonus, character: name };
      }
      return res;
    }, { value: 0, character: '' });
  }
  const overflowingLadleBonus = getHighestOverflowingLadle();
  const calcMeals = (meals, overflow) => {
    if (!meals) return []
    return meals?.map((meal) => {
      if (!meal) return null;
      const { amount, level, cookReq } = meal;
      const levelCost = getMealLevelCost(level, achievements, account, localEquinoxUpgrades);
      let timeTillNextLevel = amount >= levelCost ? '0' : calcTimeToNextLevel(levelCost - amount, cookReq, mealSpeed);
      if (overflow) {
        timeTillNextLevel = timeTillNextLevel / (1 + overflowingLadleBonus?.value / 100);
      }

      const breakpointTimes = breakpoints.map((breakpoint) => {
        if (breakpoint === 0 || breakpoint === -1 || breakpoint === -2) {
          const timeTillNextLevel = amount >= levelCost
            ? '0'
            : calcTimeToNextLevel(levelCost - amount, cookReq, mealSpeed);
          return {
            bpCost: levelCost,
            bpLevel: breakpoint,
            timeToBp: overflow ? timeTillNextLevel / (1 + overflowingLadleBonus?.value / 100) : timeTillNextLevel
          };
        }
        const bpCost = (breakpoint - level) * levelCost;
        let timeToBp = calcMealTime(breakpoint, meal, mealSpeed, achievements, localEquinoxUpgrades, account);
        if (overflow) {
          timeToBp = timeToBp / (1 + overflowingLadleBonus?.value / 100)
        }
        return { bpCost, timeToBp, bpLevel: breakpoint };
      })
      return {
        ...meal,
        levelCost,
        timeTillNextLevel,
        breakpointTimes
      };
    });
  };
  const defaultMeals = calcMeals(meals);

  // Ladles and hours are the same number (1 ladle = 1 hour of cook time), so a single
  // threshold covers both. Cost is measured against the sort target when it's a real
  // breakpoint, otherwise against the next level.
  const getMealCost = (meal) => {
    const entry = sortBy > 0
      ? meal?.breakpointTimes?.find(({ bpLevel }) => bpLevel === sortBy)
      : meal?.breakpointTimes?.[0];
    return parseFloat(entry?.timeToBp);
  }
  const isMealUpgradable = (meal) => {
    if (!meal || meal.level === 0 || meal.level >= mealMaxLevel) return false;
    return !(sortBy > 0 && meal.level >= sortBy);
  }
  const isLimitCandidate = (meal) => isMealUpgradable(meal) && Number.isFinite(getMealCost(meal));
  const applyMealLimit = (meals, limit, upgradable) => {
    if (!limit || limit >= upgradable) return meals;
    // Pick by cost, then keep the incoming sort order for display.
    const chosen = new Set((meals?.filter(isLimitCandidate) ?? [])
      .sort((a, b) => getMealCost(a) - getMealCost(b))
      .slice(0, limit)
      .map(({ index }) => index));
    // Only trims the upgradable pool; capped and unstarted meals stay governed by the other filters.
    return meals?.filter((meal) => !isLimitCandidate(meal) || chosen.has(meal.index)) ?? [];
  }
  const getCostStats = (meals) => {
    const costs = meals?.filter(isMealUpgradable)?.map(getMealCost)?.filter(Number.isFinite) ?? [];
    if (costs.length === 0) return null;
    return { total: costs.reduce((sum, cost) => sum + cost, 0) };
  }
  // Derived at render, not in the effect: the limit only slices an already-computed list, and
  // putting it in the effect deps re-ran the whole breakpoint recalc on every slider release.
  const nmlbQueue = sortBy === -2
    ? getNoMealLeftBehindQueue(meals, mealMaxLevel, procCount, {
      achievements,
      account,
      equinoxUpgrades: localEquinoxUpgrades,
      mealSpeed,
      overflowMulti: filters.includes('overflow') ? 1 + overflowingLadleBonus?.value / 100 : 1
    })
    : [];
  const nmlbLadles = nmlbQueue.reduce((sum, { ladles }) => Number.isFinite(ladles) ? sum + ladles : sum, 0);
  const upgradableCount = localMeals?.filter(isLimitCandidate)?.length ?? 0;
  const limited = mealLimit > 0 && mealLimit < upgradableCount;
  const limitedMeals = applyMealLimit(localMeals, mealLimit, upgradableCount);
  const visibleMeals = filters.includes('bookOrder')
    ? limitedMeals?.filter(Boolean)?.toSorted((a, b) => a?.index - b?.index)
    : limitedMeals;

  useEffect(() => {
    const tempFoodLust = equinoxUpgrades?.find(({ name }) => name === 'Food_Lust')?.bonus;
    setFoodLust(tempFoodLust);
  }, [characters])

  useEffect(() => {
    const temp = equinoxUpgrades?.map((upgrade) => upgrade?.name === 'Food_Lust'
      ? { ...upgrade, bonus: parseInt(foodLust) }
      : upgrade)
    setLocalEquinoxUpgrades(temp);
  }, [foodLust])

  const handleFilters = (e, newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    let tempMeals = defaultMeals;
    if (sortBy === -3) {
      tempMeals = sortMealsBy(null, -3);
    }
    else {
      breakpoints.forEach((breakpoint, index) => {
        if (sortBy === breakpoint) {
          const mealsCopy = [...defaultMeals];
          if (sortBy === -2) {
            tempMeals = getNoMealLeftBehind(mealsCopy, mealMaxLevel, true);
          }
          else {
            tempMeals = sortMealsBy(mealsCopy, index, breakpoint);
          }
        }
      })
    }
    if (filters.includes('overflow')) {
      tempMeals = calcMeals(tempMeals || meals, overflowingLadleBonus?.value)
    }
    if (filters.includes('hide')) {
      tempMeals = tempMeals.filter((meal) => meal?.level < mealMaxLevel);
    }
    if (filters.includes('amethystRhinestone') && realAmethystRhinestone === 0) {
      setMealSpeed(totalMealSpeed * amethystRhinestone);
    }
    else {
      setMealSpeed(totalMealSpeed);
    }
    const speedMeals = getBestMealsSpeedContribute(tempMeals)
    setBestSpeedMeal(speedMeals);
    setLocalMeals(tempMeals)
  }, [filters, meals, mealMaxLevel, sortBy, mealSpeed, localEquinoxUpgrades, totalMealSpeed]);


  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  }

  return (
    <>
      <ToggleButton sx={{ mr: 2, '&:disabled': { color: '#FFFFFF' } }} value={'maxLevel'} disabled>Meal max
        level: {mealMaxLevel}</ToggleButton>
      {noMealLeftBehind ? <ToggleButton sx={{ mr: 2, '&:disabled': { color: '#FFFFFF' } }} value={'maxLevel'} disabled>
        <Stack direction={'row'} alignItems={'center'}>
          <Typography>NMLB:</Typography>
          <img style={{ marginTop: -30, marginRight: -10 }} src={`${prefix}data/${noMealLeftBehind.rawName}.png`}
               alt={noMealLeftBehind.rawName}/>
          {cleanUnderscore(noMealLeftBehind.name)}
        </Stack>
      </ToggleButton> : null}
      <ToggleButtonGroup sx={{ my: 2, flexWrap: 'wrap' }} value={filters} onChange={handleFilters}>
        <ToggleButton value="minimized">Minimized</ToggleButton>
        <ToggleButton value="hide">Hide Capped</ToggleButton>
        <ToggleButton value="bookOrder">
          <Stack direction={'row'} gap={1}>
            <Typography>Book Order</Typography>
            <Tooltip
              title={'Keeps the filters above, but lists the meals in cooking book order so you can go straight down the book'}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </ToggleButton>
        <ToggleButton value="overflow">
          <Stack direction={'row'} gap={1}>
            <Typography>Overflowing Ladle</Typography>
            <Tooltip
              title={`Blood Berserker Talent: Ladles gives ${kFormatter(overflowingLadleBonus?.value, 2)}% more afk time (using ${overflowingLadleBonus?.character})`}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </ToggleButton>
        {realAmethystRhinestone === 0 ? <ToggleButton value="amethystRhinestone">
          <Stack direction={'row'} gap={1}>
            <Typography>Amethyst Rhinestone</Typography>
            <Tooltip
              title={`Apply additional 4.5 multi bonus`}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </ToggleButton> : null}
      </ToggleButtonGroup>
      <Stack direction={'row'} alignItems={'center'} gap={3}>
        <TextField size={'small'} sx={{ width: 150 }} label={'Sort by'} select value={sortBy}
                   onChange={handleSortChange}>
          {breakpoints?.map((val) => (<MenuItem key={val} value={val}>
            {val === -1 ? 'Order' : val === 0 ? 'Time' : val === -2 ? 'NMLB' : val === -3 ? 'Ribbon' : `Time to ${val}`}
          </MenuItem>))}
        </TextField>
        {breakpoints?.map((breakpoint) => {
          if (breakpoint === 0 || breakpoint === -1 || breakpoint === -2 || breakpoint === -3) return null;
          return sortBy === breakpoint && !localMeals?.some(({ level, amount }) => amount > 0 && level < breakpoint) ?
            <Typography key={'breakpoint-max' + breakpoint} sx={{ color: '#ffa726' }}>All meals are higher than
              level {breakpoint}
              !</Typography> : null;
        })}
        <TextField size={'small'} label={'Food lust bosses'} type={'number'} value={foodLust}
                   slotProps={{
                     htmlInput: { min: 0, max: 14 }
                   }}
                   sx={{ width: 130 }}
                   onChange={({ target }) => setFoodLust(target.value)}/>
      </Stack>
      <Stack my={2}>
        <Typography my={1} variant={'h5'}>Best Meal Speed Contribution</Typography>
        <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
          {bestSpeedMeal.map((meal, index) => {
            const {
              currentLevelBonus,
              nextLevelBonus,
              level,
              name,
              rawName,
              bonusDiff,
              timeTillNextLevel
            } = meal;

            return <Card key={`${name}-${index}`} sx={{ width: 350 }}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'}>
                  <MealAndPlate>
                    <img src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                    {level > 0 ?
                      <img className="plate" src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
                  </MealAndPlate>
                  <Stack gap={1}>
                    <CenteredTypography>
                      {cleanUnderscore(name)} (Lv. {level} <ArrowForwardIcon fontSize={'small'}/> {level + 1})
                    </CenteredTypography>
                    <CenteredTypography>
                      {currentLevelBonus}% <ArrowForwardIcon fontSize={'small'}/> {nextLevelBonus}%
                      ({notateNumber(bonusDiff, 'MultiplierInfo')})
                    </CenteredTypography>
                    <Typography component={'span'}>
                      Next Level: {!Number.isFinite(timeTillNextLevel) ? 'Never' :
                      new Date().getTime() + timeTillNextLevel * 3600 * 1000 < maxTimeValue ?
                      <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000}
                             staticTime={true}/> : `${getTimeAsDays(timeTillNextLevel)} days`}
                    </Typography>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <img src={`${prefix}data/Ladle.png`} alt="Ladle" width={32} height={32}/>
                      {Number.isFinite(timeTillNextLevel) ? <HtmlTooltip title={numberWithCommas(parseFloat(timeTillNextLevel).toFixed(2))}>
                        <span>{notateNumber(Math.ceil(timeTillNextLevel), 'Big')}</span>
                      </HtmlTooltip> : <span>-</span>}
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack>
      {nmlbQueue.length > 0 ? <Stack my={2}>
        <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'} my={1}>
          <Typography variant={'h5'}>NMLB Proc Queue</Typography>
          <Tooltip
            title={'No Meal Left Behind always levels your lowest meal and picks again after every proc, so one low meal can soak up a run of procs before anything else is touched. The Sacred Methods bundle adds 2 more levels per proc, all landing on that same meal. Each entry shows the ladles that proc saves you.'}>
            <InfoIcon/>
          </Tooltip>
          <TextField size={'small'} type={'number'} label={'Procs'} value={procCount} sx={{ width: 90 }}
                     slotProps={{ htmlInput: { min: 1, max: 50 } }}
                     onChange={({ target }) => {
                       const parsed = parseInt(target.value, 10);
                       setProcCount(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 15);
                     }}/>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}data/Ladle.png`} alt="Ladle" width={32} height={32}/>
            <HtmlTooltip title={`${numberWithCommas(nmlbLadles.toFixed(2))} ladles saved by these ${nmlbQueue.length} procs`}>
              <Typography sx={{ whiteSpace: 'nowrap' }}>{notateNumber(Math.ceil(nmlbLadles), 'Big')} saved</Typography>
            </HtmlTooltip>
          </Stack>
        </Stack>
        <Stack direction={'row'} flexWrap={'wrap'} gap={1}>
          {nmlbQueue.map(({ index, name, rawName, fromLevel, toLevel, ladles }, procIndex) => (
            <ProcCard key={`nmlb-${index}-${procIndex}`}>
              <Typography sx={{ color: 'text.secondary', width: 28 }}>#{procIndex + 1}</Typography>
              <img src={`${prefix}data/${rawName}.png`} alt={rawName} width={36} height={36}/>
              <Stack>
                <Typography noWrap>{cleanUnderscore(name)}</Typography>
                <Typography sx={{ color: 'text.secondary' }}>
                  Lv. {fromLevel} <ArrowForwardIcon fontSize={'small'} sx={{ verticalAlign: 'middle' }}/> {toLevel}
                </Typography>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} gap={1} ml={'auto'}>
                <img src={`${prefix}data/Ladle.png`} alt="Ladle" width={24} height={24}/>
                {Number.isFinite(ladles) ? <HtmlTooltip title={numberWithCommas(ladles.toFixed(2))}>
                  <span>{notateNumber(Math.ceil(ladles), 'Big')}</span>
                </HtmlTooltip> : <span>-</span>}
              </Stack>
            </ProcCard>
          ))}
        </Stack>
      </Stack> : null}
      <Typography my={1} variant={'h5'}>Meals</Typography>
      <MealsFilterBar upgradableCount={upgradableCount} stats={getCostStats(visibleMeals)}
                      limited={limited} value={limited ? mealLimit : upgradableCount}
                      onCommit={(val) => setMealLimit(val >= upgradableCount ? 0 : val)}/>
      <Stack direction={'row'} flexWrap="wrap" gap={2}>
        {visibleMeals?.map((meal, index) => {
          if (!meal) return null;
          const {
            name,
            amount,
            rawName,
            effect,
            level,
            baseStat,
            multiplier,
            shinyMulti,
            breakpointTimes,
            cookingMasteryNode,
            index: mealIndex
          } = meal;
          const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
          const ribbonIndex = account?.grimoire?.ribbons?.[28 + mealIndex];
          const ribbonBonus = getRibbonBonus(account, ribbonIndex);
          const companion162 = isCompanionBonusActive(account, 162)
            ? (account?.companions?.list?.at(162)?.bonus ?? 0)
            : 0;
          const nodeMulti = cookingMasteryNode?.multi ?? 1;
          const realEffect = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * (1 + (25 * companion162) / 100) * ribbonBonus * nodeMulti * level * baseStat;
          const effectNotation = realEffect < 1e7 ? commaNotation(realEffect) : notateNumber(realEffect, 'Big');

          return (
            <Card key={`${name}-${index}`} sx={{ width: 300, opacity: level === 0 ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'}>
                  <Tooltip
                    title={<MealTooltip account={account} achievements={achievements}
                                        blackDiamondRhinestone={blackDiamondRhinestone}
                                        equinoxUpgrades={localEquinoxUpgrades} {...meal}/>}>
                    <MealAndPlate>
                      <img src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                      {level > 0 ?
                        <img className="plate" src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
                    </MealAndPlate>
                  </Tooltip>
                  <Stack>
                    <Typography>{cleanUnderscore(name)} (Lv. {level})</Typography>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      {(ribbonIndex - 1) > 0 ? <Tooltip title={`${ribbonBonus}x (Rank ${ribbonIndex})`}>
                        <img style={{ width: 24 }} src={`${prefix}data/Ribbon${Math.max(0, ribbonIndex - 1)}.png`}
                             alt={`ribbon-${ribbonIndex}`}/>
                      </Tooltip> : null}
                      {cookingMasteryNode?.level > 0 ?
                        <Tooltip
                          title={`Cooking Mastery node: Lv. ${cookingMasteryNode.level} (${notateNumber(cookingMasteryNode.multi, 'MultiplierInfo')}x meal bonus)`}>
                          <img style={{ width: 24, height: 24, objectFit: 'fill' }}
                               src={`${prefix}etc/CookingMastery.png`}
                               alt={'cooking-mastery-node'}/>
                        </Tooltip> : null}
                    </Stack>
                  </Stack>
                </Stack>
                <Stack mt={2} gap={1}>
                  <Typography
                    sx={{
                      color: multiplier > 1
                        ? 'info.light'
                        : ''
                    }}>{cleanUnderscore(effect?.replace('{', effectNotation))}</Typography>
                  {!filters.includes('minimized') ?
                    breakpointTimes?.map(({ bpLevel, bpCost, timeToBp }) => {
                      const timeInMs = timeToBp * 3600 * 1000
                      return level > 0 && (sortBy === bpLevel || sortBy === -1 && bpLevel === 1) ? <Stack
                        key={name + bpLevel} gap={1}
                        flexWrap={'wrap'}>
                        {amount >= bpCost && bpLevel !== -2 ? <Typography
                          color={'success.light'}>Breakpoint maxed</Typography> : level >= mealMaxLevel ? <Typography
                            color={'success.light'}>Maxed</Typography> :
                          <Typography
                            sx={{ color: amount >= bpCost ? 'success.light' : level > 0 ? 'error.light' : '' }}>
                            Progress: {<HtmlTooltip title={parseFloat(amount)}>
                            <span>{notateNumber(Math.floor(amount), 'Big')}</span>
                          </HtmlTooltip>} / {<HtmlTooltip title={parseFloat(bpCost)}>
                            <span>{notateNumber(Math.ceil(bpCost), 'Big')}</span>
                          </HtmlTooltip>}
                          </Typography>
                        }
                        {level < mealMaxLevel ? <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
                          <Typography>Next Milestone: </Typography>
                          {!Number.isFinite(timeToBp) ? 'Never' :
                          new Date().getTime() + timeInMs < maxTimeValue
                            ? <Timer
                              date={new Date().getTime() + timeToBp * 3600 * 1000}
                              staticTime={true}/>
                            : `${notateNumber(getTimeAsDays(timeToBp), 'Big')} days`
                          }
                        </Stack> : null}
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                          <img src={`${prefix}data/Ladle.png`} alt="Ladle" width={32} height={32}/>
                          {Number.isFinite(timeToBp) ? <HtmlTooltip title={numberWithCommas(parseFloat(timeToBp).toFixed(2))}>
                            <span>{notateNumber(Math.ceil(timeToBp), 'Big')}</span>
                          </HtmlTooltip> : <span>-</span>}
                        </Stack>
                      </Stack> : null
                    }) : null}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};


// Slider narrows the list to the N cheapest meals to upgrade, and the total next to it is the
// ladles that batch costs. Only the total is shown: a ladle stack is spent in full when used, so
// a per-meal maximum would just tell people to over-pull on everything but the priciest meal.
const MealsFilterBar = ({ upgradableCount, stats, limited, value, onCommit }) => {
  // Drag position is kept here on purpose: the meal list only changes on release, so letting it
  // live in the parent re-rendered every card on every mousemove.
  const [dragValue, setDragValue] = useState(null);
  if (upgradableCount === 0) return null;
  const shownValue = dragValue ?? value;
  return (
    <Stack direction={'row'} alignItems={'center'} gap={3} flexWrap={'wrap'} mb={2}>
      <Stack direction={'row'} alignItems={'center'} gap={2}>
        <Slider size={'small'} sx={{ width: 130 }} min={1} max={upgradableCount} value={shownValue}
                onChange={(e, val) => setDragValue(val)}
                onChangeCommitted={(e, val) => {
                  setDragValue(null);
                  onCommit(val);
                }}/>
        <TextField size={'small'} type={'number'} value={shownValue}
                   slotProps={{ htmlInput: { min: 1, max: upgradableCount } }}
                   sx={{ width: 80 }}
                   onChange={({ target }) => {
                     const parsed = parseInt(target.value, 10);
                     onCommit(Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), upgradableCount) : upgradableCount);
                   }}/>
        <Typography sx={{ color: limited ? 'info.light' : '', whiteSpace: 'nowrap' }}>
          of {upgradableCount}
        </Typography>
        <Tooltip
          title={'Narrows the list to the cheapest meals to upgrade, so you can pull one page of ladles and work straight down it. Cost is measured against the sort target above, and ladles and hours are the same number.'}>
          <InfoIcon/>
        </Tooltip>
      </Stack>
      <Stack direction={'row'} alignItems={'center'} gap={2} divider={<Divider orientation={'vertical'} flexItem/>}>
        {stats ? <>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <img src={`${prefix}data/Ladle.png`} alt="Ladle" width={32} height={32}/>
            <Typography sx={{ whiteSpace: 'nowrap' }}>{notateNumber(Math.ceil(stats.total), 'Big')} total</Typography>
            <Tooltip
              title={`${numberWithCommas(stats.total.toFixed(2))} ladles to upgrade every meal shown - the sum of the per-meal figures on the cards below`}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </> : null}
        {limited ? <Button size={'small'} onClick={() => onCommit(upgradableCount)}>Reset</Button> : null}
      </Stack>
    </Stack>
  );
};

const MealTooltip = ({
                       account,
                       level,
                       baseStat,
                       effect,
                       blackDiamondRhinestone,
                       shinyMulti,
                       index,
                       cookingMasteryNode
                     }) => {
  const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
  const ribbonBonus = getRibbonBonus(account, account?.grimoire?.ribbons?.[28 + index]);
  const companion162 = isCompanionBonusActive(account, 162) ? (account?.companions?.list?.at(162)?.bonus ?? 0) : 0;
  const nodeMulti = cookingMasteryNode?.multi ?? 1;
  const realEffect = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * (1 + (25 * companion162) / 100) * (level + 1) * ribbonBonus * nodeMulti * baseStat;
  const effectNotation = realEffect < 1e7 ? commaNotation(realEffect) : notateNumber(realEffect, 'Big')
  return (
    <>
      <Typography fontWeight={'bold'}>
        Next Level Bonus:&nbsp;
        <Typography component={'span'} sx={{ fontWeight: 400 }}>
          {cleanUnderscore(effect?.replace('{', effectNotation))}
        </Typography>
      </Typography>
    </>
  );
};

const MealAndPlate = styled.div`
  width: 82px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: -20px;

  & img:nth-of-type(1) {
    margin-top: -30px;
  }

  & img {
    margin-left: -30px;
  }
`;

const ProcCard = styled(Card)`
  width: 320px;
  padding: 8px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const CenteredTypography = styled(Typography)`
  & {
    display: flex;
    align-items: center;
  }
`

export default Meals;

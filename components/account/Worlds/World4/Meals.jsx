import React, { useEffect, useMemo, useState } from 'react';
import { calcMealTime, calcTimeToNextLevel, getMealLevelCost, getRibbonBonus } from 'parsers/cooking';
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
import { Card, CardContent, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import HtmlTooltip from 'components/Tooltip';
import Timer from 'components/common/Timer';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuItem from '@mui/material/MenuItem';
import { getJewelBonus, getLabBonus } from '@parsers/lab';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { checkCharClass, CLASSES } from '@parsers/talents';

const maxTimeValue = 8.64e15;

const breakpoints = [-1, 0, -2, -3, 11, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const Meals = ({ account, characters, meals, totalMealSpeed, mealMaxLevel, achievements, lab, equinoxUpgrades }) => {
  const [filters, setFilters] = useState(() => []);
  const [localMeals, setLocalMeals] = useState();
  const [bestSpeedMeal, setBestSpeedMeal] = useState([]);
  const [mealSpeed, setMealSpeed] = useState(totalMealSpeed);
  const [sortBy, setSortBy] = useState(breakpoints[0]);
  const [foodLust, setFoodLust] = useState(account?.equinox?.upgrades?.find(({ name }) => name === 'Food_Lust')?.bonus)
  const [localEquinoxUpgrades, setLocalEquinoxUpgrades] = useState(account?.equinox?.upgrades);
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(lab?.jewels, 16, spelunkerObolMulti);
  const allPurpleActive = lab?.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
  const realAmethystRhinestone = getJewelBonus(lab?.jewels, 0, spelunkerObolMulti) * allPurpleActive;
  const amethystRhinestone = 4.5;
  const getNoMealLeftBehind = (baseMeals, mealMaxLevel, returnArray) => {
    const bonusActivated = isJadeBonusUnlocked(account, 'No_Meal_Left_Behind');
    if (bonusActivated) {
      const mealToUpgrade = 1;
      const sortedMeals = baseMeals.filter(meal => meal.level > 5 && meal.level < mealMaxLevel).sort((meal1, meal2) => {
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
  const noMealLeftBehind = useMemo(() => getNoMealLeftBehind(meals, mealMaxLevel), [meals, mealMaxLevel]);
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
      const { level, baseStat, shinyMulti, timeTillNextLevel, index } = meal;
      const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
      const ribbonBonus = getRibbonBonus(account, account?.grimoire?.ribbons?.[28 + index]);
      const base = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * ribbonBonus * baseStat;
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
  const overflowingLadleBonus = useMemo(() => getHighestOverflowingLadle(), [characters]);
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
  const defaultMeals = useMemo(() => calcMeals(meals), [meals, mealSpeed, localEquinoxUpgrades]);

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
               alt=""/>
          {cleanUnderscore(noMealLeftBehind.name)}
        </Stack>
      </ToggleButton> : null}
      <ToggleButtonGroup sx={{ my: 2, flexWrap: 'wrap' }} value={filters} onChange={handleFilters}>
        <ToggleButton value="minimized">Minimized</ToggleButton>
        <ToggleButton value="hide">Hide Capped</ToggleButton>
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
                    <img src={`${prefix}data/${rawName}.png`} alt=""/>
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
                      Next Level: {new Date().getTime() + timeTillNextLevel * 3600 * 1000 < maxTimeValue ?
                      <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000}
                             staticTime={true}/> : `${getTimeAsDays(timeTillNextLevel)} days`}
                    </Typography>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <img src={`${prefix}data/Ladle.png`} alt="" width={32} height={32}/>
                      <HtmlTooltip title={numberWithCommas(parseFloat(timeTillNextLevel).toFixed(2))}>
                        <span>{notateNumber(Math.ceil(timeTillNextLevel), 'Big')}</span>
                      </HtmlTooltip>
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack>
      <Typography my={1} variant={'h5'}>Meals</Typography>
      <Stack direction={'row'} flexWrap="wrap" gap={2}>
        {localMeals?.map((meal, index) => {
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
            index: mealIndex
          } = meal;
          const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
          const ribbonIndex = account?.grimoire?.ribbons?.[28 + mealIndex];
          const ribbonBonus = getRibbonBonus(account, ribbonIndex);
          const realEffect = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * ribbonBonus * level * baseStat;
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
                      <img src={`${prefix}data/${rawName}.png`} alt=""/>
                      {level > 0 ?
                        <img className="plate" src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
                    </MealAndPlate>
                  </Tooltip>
                  <Stack>
                    <Typography>{cleanUnderscore(name)} (Lv. {level})</Typography>
                    {(ribbonIndex - 1) > 0 ? <Tooltip title={`${ribbonBonus}x (Rank ${ribbonIndex})`}>
                      <img style={{ width: 24 }} src={`${prefix}data/Ribbon${Math.max(0, ribbonIndex - 1)}.png`}
                           alt={`ribbon-${ribbonIndex}`}/>
                    </Tooltip> : null}
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
                          {new Date().getTime() + timeInMs < maxTimeValue
                            ? <Timer
                              date={new Date().getTime() + timeToBp * 3600 * 1000}
                              staticTime={true}/>
                            : `${notateNumber(getTimeAsDays(timeToBp), 'Big')} days`
                          }
                        </Stack> : null}
                        <Stack direction={'row'} alignItems={'center'} gap={1}>
                          <img src={`${prefix}data/Ladle.png`} alt="" width={32} height={32}/>
                          <HtmlTooltip title={numberWithCommas(parseFloat(timeToBp).toFixed(2))}>
                            <span>{notateNumber(Math.ceil(timeToBp), 'Big')}</span>
                          </HtmlTooltip>
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


const MealTooltip = ({ account, level, baseStat, effect, blackDiamondRhinestone, shinyMulti, index }) => {
  const winBonus = getWinnerBonus(account, '<x Meal Bonuses');
  const ribbonBonus = getRibbonBonus(account, account?.grimoire?.ribbons?.[28 + index]);
  const realEffect = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (1 + winBonus / 100) * (level + 1) * ribbonBonus * baseStat;
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

const CenteredTypography = styled(Typography)`
  & {
    display: flex;
    align-items: center;
  }
`

export default Meals;

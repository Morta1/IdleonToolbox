import React, { useEffect, useMemo, useState } from 'react';
import { calcMealTime, calcTimeToNextLevel, getMealLevelCost } from 'parsers/cooking';
import { cleanUnderscore, growth, kFormatter, notateNumber, numberWithCommas, prefix } from 'utility/helpers';
import { Card, CardContent, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import styled from '@emotion/styled';
import Tooltip from 'components/Tooltip';
import HtmlTooltip from 'components/Tooltip';
import Box from '@mui/material/Box';
import Timer from 'components/common/Timer';
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuItem from '@mui/material/MenuItem';
import { isArtifactAcquired } from '../../../../parsers/sailing';
import { getJewelBonus, getLabBonus } from '../../../../parsers/lab';

const msPerDay = 8.64e+7;
const maxTimeValue = 9.007199254740992e+15;
let DEFAULT_MEAL_MAX_LEVEL = 30;
const breakpoints = [-1, 0, 11, 30];
const Meals = ({ characters, meals, totalMealSpeed, achievements, artifacts, lab }) => {
  const [filters, setFilters] = React.useState(() => []);
  const [localMeals, setLocalMeals] = useState();
  const [bestSpeedMeal, setBestSpeedMeal] = useState([]);
  const [mealMaxLevel, setMealMaxLevel] = useState(DEFAULT_MEAL_MAX_LEVEL);
  const [mealSpeed, setMealSpeed] = useState(totalMealSpeed);
  const [sortBy, setSortBy] = useState(breakpoints[0]);
  const spelunkerObolMulti = getLabBonus(lab.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(lab?.jewels, 16, spelunkerObolMulti);
  const allPurpleActive = lab.jewels?.slice(0, 3)?.every(({ active }) => active) ? 2 : 1;
  const realAmethystRhinestone = getJewelBonus(lab.jewels, 0, spelunkerObolMulti) * allPurpleActive;
  const amethystRhinestone = 4.5;

  const getHighestOverflowingLadle = () => {
    const bloodBerserkers = characters?.filter((character) => character?.class === 'Blood_Berserker');
    return bloodBerserkers.reduce((res, { talents }) => {
      const overflowingLadle = talents?.[3]?.orderedTalents.find((talent) => talent?.name === 'OVERFLOWING_LADLE');
      const lv = overflowingLadle?.level > overflowingLadle?.maxLevel
        ? overflowingLadle?.level
        : overflowingLadle?.maxLevel;
      const bonus = growth(overflowingLadle?.funcX, lv, overflowingLadle?.x1, overflowingLadle?.x2, false);
      if (bonus > res) {
        return bonus
      }
      return res;
    }, 0);
  }
  const overflowingLadleBonus = useMemo(() => getHighestOverflowingLadle(), [characters]);
  const calcMeals = (meals, overflow) => {
    return meals?.map((meal) => {
      if (!meal) return null;
      const { amount, level, cookReq } = meal;
      const levelCost = getMealLevelCost(level, achievements);
      const diamondCost = (11 - level) * levelCost;
      const blackVoidCost = (30 - level) * levelCost;
      let timeTillNextLevel = amount >= levelCost ? '0' : calcTimeToNextLevel(levelCost - amount, cookReq, mealSpeed);
      let timeToDiamond = calcMealTime(11, meal, mealSpeed, achievements);
      let timeToBlackVoid = calcMealTime(30, meal, mealSpeed, achievements);
      if (overflow) {
        timeTillNextLevel = timeTillNextLevel / (1 + overflowingLadleBonus / 100);
        timeToDiamond = timeToDiamond / (1 + overflowingLadleBonus / 100);
        timeToBlackVoid = timeToBlackVoid / (1 + overflowingLadleBonus / 100);
      }
      return {
        ...meal, levelCost, diamondCost,
        timeTillNextLevel,
        timeToDiamond,
        timeToBlackVoid,
        blackVoidCost,
      };
    });
  };

  const defaultMeals = useMemo(() => calcMeals(meals), [meals, mealSpeed]);

  useEffect(() => {
    const causticolumnArtifact = isArtifactAcquired(artifacts, 'Causticolumn');
    if (causticolumnArtifact) {
      setMealMaxLevel(DEFAULT_MEAL_MAX_LEVEL + causticolumnArtifact?.bonus);
    }
  }, [artifacts]);

  const handleFilters = (e, newFilters) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    let tempMeals;
    if (sortBy === 0) {
      const mealsCopy = [...defaultMeals];
      tempMeals = sortMealsBy(mealsCopy, 'timeTillNextLevel');
    } else if (sortBy === 11) {
      const mealsCopy = [...defaultMeals];
      tempMeals = sortMealsBy(mealsCopy, 'timeToDiamond', 11);
    } else if (sortBy === 30) {
      const mealsCopy = [...defaultMeals];
      tempMeals = sortMealsBy(mealsCopy, 'timeToBlackVoid', 30);
    } else {
      tempMeals = defaultMeals;
    }
    if (filters.includes('overflow')) {
      tempMeals = calcMeals(tempMeals || meals, overflowingLadleBonus)
    }
    if (filters.includes('hide')) {
      tempMeals = tempMeals.filter((meal) => meal?.level < mealMaxLevel);
    }

    if (filters.includes('amethystRhinestone') && realAmethystRhinestone === 0) {
      setMealSpeed(totalMealSpeed * amethystRhinestone);
    } else {
      setMealSpeed(totalMealSpeed);
    }

    const speedMeals = getBestMealsSpeedContribute(tempMeals)
    setBestSpeedMeal(speedMeals);
    setLocalMeals(tempMeals)
  }, [filters, meals, mealMaxLevel, sortBy, mealSpeed]);

  const sortMealsBy = (meals, sortBy, level = 0) => {
    const mealsCopy = [...defaultMeals];
    mealsCopy.sort((a, b) => {
      if (level !== 0) {
        if (a.level >= level) {
          return 1;
        } else if (b.level >= level) {
          return -1;
        }
      }
      return a?.[sortBy] - b?.[sortBy]
    });
    return mealsCopy;
  }

  const getBestMealsSpeedContribute = (meals) => {
    let speedMeals = meals.filter((meal) => (meal?.stat === 'Mcook' || meal?.stat === 'KitchenEff') && meal?.level < mealMaxLevel);
    speedMeals = speedMeals.map((meal) => {
      const { level, baseStat, shinyMulti, timeTillNextLevel } = meal;
      const currentBonus = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * level * baseStat;
      const nextLevelBonus = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * (level + 1) * baseStat;
      return {
        ...meal,
        currentLevelBonus: notateNumber(currentBonus),
        nextLevelBonus: notateNumber(nextLevelBonus),
        bonusDiff: nextLevelBonus - currentBonus,
        diff: (nextLevelBonus - currentBonus) / timeTillNextLevel
      }
    });
    speedMeals.sort((a, b) => b.diff - a.diff);
    return speedMeals;
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  }

  return (
    <>
      <ToggleButtonGroup sx={{ my: 2, flexWrap: 'wrap' }} value={filters} onChange={handleFilters}>
        <ToggleButton value="minimized">Minimized</ToggleButton>
        <ToggleButton value="hide">Hide capped</ToggleButton>
        <ToggleButton value="overflow">
          <Stack direction={'row'} gap={1}>
            <Typography>Overflowing Ladle</Typography>
            <Tooltip
              title={`Blood Berserker Talent: Ladles gives ${kFormatter(overflowingLadleBonus, 2)}% more afk time`}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </ToggleButton>
        <ToggleButton value="amethystRhinestone">
          <Stack direction={'row'} gap={1}>
            <Typography>Amethyst Rhinestone</Typography>
            <Tooltip
              title={`Apply additional 4.5 multi bonus`}>
              <InfoIcon/>
            </Tooltip>
          </Stack>
        </ToggleButton>
      </ToggleButtonGroup>
      <Stack direction={'row'} alignItems={'center'} gap={3}>
        <TextField sx={{ width: 150 }} label={'Sort by'} select value={sortBy} onChange={handleSortChange}>
          {breakpoints?.map((val) => (<MenuItem key={val} value={val}>
            {val === -1 ? 'Order' : val === 0 ? 'Time' : `Time to ${val}`}
          </MenuItem>))}
        </TextField>
        {sortBy === 11 && !localMeals?.some(({ level, amount }) => amount > 0 && level < 11) ?
          <Typography sx={{ color: '#ffa726' }}>All meals are higher than level 11 !</Typography> : null}
        {sortBy === 30 && !localMeals?.some(({ level, amount }) => amount > 0 && level < 30) ?
          <Typography sx={{ color: '#ffa726' }}>All meals are higher than level 30 !</Typography> : null}
      </Stack>
      <Stack my={2}>
        <Typography my={1} variant={'h5'}>Best meal speed contribution</Typography>
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
            return <Card key={`${name}-${index}`} sx={{ width: 340 }}>
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
                      ({kFormatter(bonusDiff)})
                    </CenteredTypography>
                    <Typography component={'span'}>
                      Next level: {timeTillNextLevel * 3600 * 1000 < maxTimeValue ?
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
            levelCost,
            timeTillNextLevel,
            timeToDiamond,
            timeToBlackVoid
          } = meal;
          const realEffect = (1 + (blackDiamondRhinestone + shinyMulti) / 100) * level * baseStat;
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300, opacity: level === 0 ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={'row'} alignItems={'center'}>
                  <Tooltip title={<MealTooltip achievements={achievements} {...meal} />}>
                    <MealAndPlate>
                      <img src={`${prefix}data/${rawName}.png`} alt=""/>
                      {level > 0 ?
                        <img className="plate" src={`${prefix}data/CookingPlate${level - 1}.png`} alt=""/> : null}
                    </MealAndPlate>
                  </Tooltip>
                  <Typography>
                    {cleanUnderscore(name)} (Lv. {level})
                  </Typography>
                </Stack>
                <Stack mt={2} gap={1}>
                  <Typography
                    sx={{
                      color: multiplier > 1
                        ? 'info.light'
                        : ''
                    }}>{cleanUnderscore(effect?.replace('{', kFormatter(realEffect)))}</Typography>
                  {!filters.includes('minimized') ? (
                    meal?.level === mealMaxLevel ? <Typography color={'success.light'}>MAXED</Typography> : <>
                      <Typography
                        sx={{ color: amount >= levelCost ? 'success.light' : level > 0 ? 'error.light' : '' }}>
                        Progress: {<HtmlTooltip title={numberWithCommas(parseInt(amount))}>
                        <span>{notateNumber(Math.floor(amount), 'Big')}</span>
                      </HtmlTooltip>} / {<HtmlTooltip title={numberWithCommas(parseInt(levelCost))}>
                        <span>{notateNumber(Math.ceil(levelCost), 'Big')}</span>
                      </HtmlTooltip>}
                      </Typography>
                      {level > 0 ? (
                        <>
                          {sortBy === 0 || sortBy === -1 ? <Typography component={'span'}>
                            Next level: {timeTillNextLevel * 3600 * 1000 < maxTimeValue ?
                            <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000}
                                   staticTime={true}/> : `${getTimeAsDays(timeTillNextLevel)} days`}
                          </Typography> : null}
                          {sortBy === 11 && level < 11 ? (
                            <Typography>
                              Next milestone: {timeToDiamond * 3600 * 1000 < maxTimeValue ?
                              <Timer date={new Date().getTime() + timeToDiamond * 3600 * 1000}
                                     staticTime={true}/> : `${getTimeAsDays(timeToDiamond)} days`}
                            </Typography>
                          ) : null}
                          {sortBy === 30 && level < 30 && timeToBlackVoid > 0 ? (
                            <Typography>
                              {/* Calculating days manually because of JS limitation for dates https://262.ecma-international.org/5.1/#sec-15.9.1.1 */}
                              Next milestone: {parseInt(getTimeAsDays(timeToBlackVoid))} days
                            </Typography>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : null}
                  {meal?.level < mealMaxLevel ? <>
                    {(sortBy === -1 || sortBy === 0) && <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <img src={`${prefix}data/Ladle.png`} alt="" width={32} height={32}/>
                      <HtmlTooltip title={numberWithCommas(parseFloat(timeTillNextLevel).toFixed(2))}>
                        <span>{notateNumber(Math.ceil(timeTillNextLevel), 'Big')}</span>
                      </HtmlTooltip>
                    </Stack>}
                    {sortBy === 11 && level < 11 && level > 0 ?
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <img src={`${prefix}data/Ladle.png`} alt="" width={32} height={32}/>
                        <HtmlTooltip title={numberWithCommas(parseFloat(timeToDiamond).toFixed(2))}>
                          <span>{notateNumber(Math.ceil(timeToDiamond), 'Big')}</span>
                        </HtmlTooltip>
                      </Stack> : null}
                    {sortBy === 30 && level < 30 && level > 0 ?
                      <Stack direction={'row'} alignItems={'center'} gap={1}>
                        <img src={`${prefix}data/Ladle.png`} alt="" width={32} height={32}/>
                        <HtmlTooltip title={numberWithCommas(parseFloat(timeToBlackVoid).toFixed(2))}>
                          <span>{notateNumber(Math.ceil(timeToBlackVoid), 'Big')}</span>
                        </HtmlTooltip>
                      </Stack> : null}
                  </> : null}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};

const getTimeAsDays = (time) => {
  return Math.ceil(time * 3600 * 1000 / msPerDay);
}

const MealTooltip = ({ level, baseStat, multiplier, effect, achievements }) => {
  const levelCost = getMealLevelCost(level + 1, achievements);
  return (
    <>
      <Typography fontWeight={'bold'}>
        Next level bonus:&nbsp;
        <Typography component={'span'} sx={{ fontWeight: 400 }}>
          {cleanUnderscore(effect?.replace('{', kFormatter((level + 1) * baseStat * multiplier)))}
        </Typography>
      </Typography>
      <Box>
        <Typography fontWeight={'bold'}>
          Next level req:&nbsp;
          <Typography component={'span'} sx={{ fontWeight: 400 }}>
            {numberWithCommas(parseInt(levelCost))}
          </Typography>
        </Typography>
      </Box>
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

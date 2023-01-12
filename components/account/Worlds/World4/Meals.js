import React, { useEffect, useMemo, useState } from "react";
import { calcMealTime, calcTimeToNextLevel, getMealLevelCost } from "parsers/cooking";
import { cleanUnderscore, growth, kFormatter, numberWithCommas, prefix } from "utility/helpers";
import { Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";
import Box from "@mui/material/Box";
import Timer from "components/common/Timer";
import InfoIcon from '@mui/icons-material/Info';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { isArtifactAcquired } from "../../../../parsers/sailing";

let DEFAULT_MEAL_MAX_LEVEL = 30;

const Meals = ({ characters, meals, totalMealSpeed, achievements, artifacts }) => {
  const [filters, setFilters] = React.useState(() => []);
  const [localMeals, setLocalMeals] = useState();
  const [bestSpeedMeal, setBestSpeedMeal] = useState([]);
  const [mealMaxLevel, setMealMaxLevel] = useState(DEFAULT_MEAL_MAX_LEVEL);

  const getHighestOverflowingLadle = () => {
    const bloodBerserkers = characters?.filter((character) => character?.class === 'Blood_Berserker');
    return bloodBerserkers.reduce((res, { talents }) => {
      const overflowingLadle = talents?.[3]?.orderedTalents.find((talent) => talent?.name === 'OVERFLOWING_LADLE');
      const symbolsOfBeyond = talents?.[3]?.orderedTalents.find((talent) => talent?.name === 'SYMBOLS_OF_BEYOND_~R');
      const symbolsOfBeyondBonus = growth(symbolsOfBeyond?.funcX, symbolsOfBeyond?.maxLevel, symbolsOfBeyond?.x1, symbolsOfBeyond?.x2, false);
      const bonus = growth(overflowingLadle?.funcX, overflowingLadle?.maxLevel + symbolsOfBeyondBonus, overflowingLadle?.x1, overflowingLadle?.x2, false);
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
      let timeTillNextLevel = amount >= levelCost ? "0" : calcTimeToNextLevel(levelCost - amount, cookReq, totalMealSpeed);
      // let timeTillMaxLevel = calcMealTime(30, meal, totalMealSpeed, achievements);
      let timeToDiamond = calcMealTime(11, meal, totalMealSpeed, achievements);
      if (overflow) {
        timeTillNextLevel = timeTillNextLevel / (1 + overflowingLadleBonus / 100);
        // timeTillMaxLevel = timeTillMaxLevel / (1 + overflowingLadleBonus / 100);
        timeToDiamond = timeToDiamond / (1 + overflowingLadleBonus / 100);
      }
      return { ...meal, levelCost, diamondCost, timeTillNextLevel, timeToDiamond };
    });
  };

  const defaultMeals = useMemo(() => calcMeals(meals), [meals]);

  useEffect(() => {
    const causticolumnArtifact = isArtifactAcquired(artifacts, 'Causticolumn');
    if (causticolumnArtifact) {
      setMealMaxLevel(DEFAULT_MEAL_MAX_LEVEL + causticolumnArtifact?.bonus);
    }
  }, [artifacts]);

  useEffect(() => {
    let tempMeals;
    if (filters.includes("time")) {
      const mealsCopy = [...defaultMeals];
      mealsCopy.sort((a, b) => {
        if (a.level === 0) {
          return 1;
        } else if (b.level === 0) {
          return -1;
        }
        return a.timeTillNextLevel - b.timeTillNextLevel
      });
      tempMeals = mealsCopy;
    } else {
      tempMeals = defaultMeals;
    }
    if (filters.includes('overflow')) {
      tempMeals = calcMeals(tempMeals || meals, overflowingLadleBonus)
    }
    if (filters.includes('hide')) {
      tempMeals = tempMeals.filter((meal) => meal?.level < mealMaxLevel);
    }
    const speedMeals = getBestMealsSpeedContribute(tempMeals)
    setBestSpeedMeal(speedMeals);
    setLocalMeals(tempMeals)
  }, [filters, meals, mealMaxLevel]);

  const handleFilters = (e, newFilters) => {
    setFilters(newFilters);
  };

  const getBestMealsSpeedContribute = (meals) => {
    let speedMeals = meals.filter((meal) => (meal?.stat === 'Mcook' || meal?.stat === 'KitchenEff') && meal?.level < mealMaxLevel);
    speedMeals = speedMeals.map((meal) => {
      const { level, baseStat, multiplier, timeTillNextLevel } = meal;
      const currentBonus = (level) * baseStat * multiplier;
      const nextLevelBonus = (level + 1) * baseStat * multiplier;
      return {
        ...meal,
        currentLevelBonus: currentBonus,
        nextLevelBonus: nextLevelBonus,
        bonusDiff: nextLevelBonus - currentBonus,
        diff: (nextLevelBonus - currentBonus) / timeTillNextLevel
      }
    });
    speedMeals.sort((a, b) => b.diff - a.diff);
    return speedMeals;
  }


  return (
    <>
      <ToggleButtonGroup sx={{ my: 2 }} value={filters} onChange={handleFilters}>
        <ToggleButton value="minimized">Minimized</ToggleButton>
        <ToggleButton value="time">Sort by time</ToggleButton>
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
      </ToggleButtonGroup>
      <Stack my={2}>
        <Typography my={1} variant={'h5'}>Best meal speed contribution</Typography>
        <Stack gap={2} direction={'row'} flexWrap={'wrap'}>
          {bestSpeedMeal.map((meal, index) => {
            const { currentLevelBonus, nextLevelBonus, level, name, rawName, bonusDiff, timeTillNextLevel } = meal;
            return <Card key={`${name}-${index}`} sx={{ width: 340 }}>
              <CardContent>
                <Stack direction={"row"} alignItems={"center"}>
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
                    <Typography component={"span"}>
                      Next level: <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000}
                                         staticTime={true}/>
                    </Typography>
                    <Typography>Ladles: {numberWithCommas(parseFloat(timeTillNextLevel).toFixed(2))}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          })}
        </Stack>
      </Stack>
      <Typography my={1} variant={'h5'}>Meals</Typography>
      <Stack direction={"row"} flexWrap="wrap" gap={2}>
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
            levelCost,
            diamondCost,
            timeTillNextLevel,
            timeToDiamond
          } = meal;
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300, opacity: level === 0 ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={"row"} alignItems={"center"}>
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
                    sx={{ color: multiplier > 1 ? "info.light" : "" }}>{cleanUnderscore(effect?.replace("{", kFormatter(level * baseStat * multiplier)))}</Typography>
                  {meal?.level < mealMaxLevel ? <>
                    <Typography>Ladles: {numberWithCommas(parseFloat(timeTillNextLevel).toFixed(2))}</Typography>
                    {/*<Typography>Ladles to max: {numberWithCommas(parseFloat(timeTillMaxLevel).toFixed(2))}</Typography>*/}
                  </> : null}
                  {!filters.includes("minimized") ? (
                    meal?.level === mealMaxLevel ? <Typography color={'success.light'}>MAXED</Typography> : <>
                      <Typography
                        sx={{ color: amount >= levelCost ? "success.light" : level > 0 ? "error.light" : "" }}>
                        Progress: {numberWithCommas(parseInt(amount))} / {numberWithCommas(parseInt(levelCost))}
                      </Typography>
                      {level > 0 ? (
                        <>
                          <Typography component={"span"}>
                            Next level: <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000}
                                               staticTime={true}/>
                          </Typography>
                          {level < 11 && levelCost !== diamondCost ? (
                            <Typography>
                              Diamond: <Timer date={new Date().getTime() + timeToDiamond * 3600 * 1000}
                                              staticTime={true}/>
                            </Typography>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  ) : null}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};

const MealTooltip = ({ level, baseStat, multiplier, effect, achievements }) => {
  const levelCost = getMealLevelCost(level + 1, achievements);
  return (
    <>
      <Typography fontWeight={"bold"}>
        Next level bonus:&nbsp;
        <Typography component={"span"} sx={{ fontWeight: 400 }}>
          {cleanUnderscore(effect?.replace("{", kFormatter((level + 1) * baseStat * multiplier)))}
        </Typography>
      </Typography>
      <Box>
        <Typography fontWeight={"bold"}>
          Next level req:&nbsp;
          <Typography component={"span"} sx={{ fontWeight: 400 }}>
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

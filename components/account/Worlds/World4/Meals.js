import React, { useState, useEffect, useMemo } from "react";
import { calcTimeTillDiamond, calcTimeToNextLevel, getMealLevelCost } from "parsers/cooking";
import { cleanUnderscore, kFormatter, numberWithCommas, prefix } from "utility/helpers";
import { Card, CardContent, Stack, Typography, ToggleButtonGroup, ToggleButton } from "@mui/material";
import styled from "@emotion/styled";
import Tooltip from "components/Tooltip";
import Box from "@mui/material/Box";
import Timer from "components/common/Timer";

const Meals = ({ meals, totalMealSpeed }) => {
  const [filters, setFilters] = React.useState(() => []);
  const [localMeals, setLocalMeals] = useState();

  const calcMeals = () => {
    return meals?.map((meal) => {
      if (!meal) return null;
      const { amount, level, cookReq } = meal;
      const levelCost = getMealLevelCost(level);
      const diamondCost = (11 - level) * levelCost;
      const timeTillNextLevel = amount >= levelCost ? "0" : calcTimeToNextLevel(levelCost - amount, cookReq, totalMealSpeed);
      const timeToDiamond = calcTimeTillDiamond(meal, totalMealSpeed);
      return { ...meal, levelCost, diamondCost, timeTillNextLevel, timeToDiamond };
    });
  };

  const defaultMeals = useMemo(() => calcMeals(), [meals]);

  useEffect(() => {
    if (filters.includes("time")) {
      const mealsCopy = [...defaultMeals];
      mealsCopy.sort((a, b) => (a.level === 0 || b.level === 0 ? 0 : a.timeTillNextLevel - b.timeTillNextLevel));
      setLocalMeals(mealsCopy);
    } else {
      setLocalMeals(defaultMeals);
    }
  }, [filters]);

  const handleFilters = (e, newFilters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <ToggleButtonGroup sx={{ my: 2 }} value={filters} onChange={handleFilters}>
        <ToggleButton value="minimized">Minimized</ToggleButton>
        <ToggleButton value="time">Sort by time</ToggleButton>
      </ToggleButtonGroup>
      <Stack direction={"row"} flexWrap="wrap" gap={2}>
        {localMeals?.map((meal, index) => {
          if (!meal) return null;
          const { name, amount, rawName, effect, level, baseStat, multiplier, levelCost, diamondCost, timeTillNextLevel, timeToDiamond } = meal;
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300, opacity: level === 0 ? 0.5 : 1 }}>
              <CardContent>
                <Stack direction={"row"} alignItems={"center"}>
                  <Tooltip title={<MealTooltip {...meal} />}>
                    <MealAndPlate>
                      <img src={`${prefix}data/${rawName}.png`} alt="" />
                      {level > 0 ? <img className="plate" src={`${prefix}data/CookingPlate${level - 1}.png`} alt="" /> : null}
                    </MealAndPlate>
                  </Tooltip>
                  <Typography>
                    {cleanUnderscore(name)} (Lv. {level})
                  </Typography>
                </Stack>
                <Stack mt={2} gap={1}>
                  <Typography sx={{ color: multiplier > 1 ? "info.light" : "" }}>{cleanUnderscore(effect?.replace("{", kFormatter(level * baseStat * multiplier)))}</Typography>
                  {!filters.includes("minimized") ? (
                    <>
                      <Typography sx={{ color: amount >= levelCost ? "success.light" : level > 0 ? "error.light" : "" }}>
                        Progress: {numberWithCommas(parseInt(amount))} / {numberWithCommas(parseInt(levelCost))}
                      </Typography>
                      {level > 0 ? (
                        <>
                          <Typography component={"span"}>
                            Next level: <Timer date={new Date().getTime() + timeTillNextLevel * 3600 * 1000} staticTime={true} />
                          </Typography>
                          {level < 11 && levelCost !== diamondCost ? (
                            <Typography>
                              Diamond: <Timer date={new Date().getTime() + timeToDiamond * 3600 * 1000} staticTime={true} />
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

const MealTooltip = ({ level, baseStat, multiplier, effect }) => {
  const levelCost = getMealLevelCost(level + 1);
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

export default Meals;

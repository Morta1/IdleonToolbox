import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, notateNumber, prefix } from '../../../../utility/helpers';
import Tooltip from 'components/Tooltip';
import Timer from 'components/common/Timer';
import React, { useMemo } from 'react';
import {
  calcMealTime,
  calcTimeToNextLevel,
  getMealLevelCost,
  maxNumberOfSpiceClicks,
  spicesNames
} from 'parsers/cooking';
import styled from '@emotion/styled';
import ProgressBar from 'components/common/ProgressBar';
import { getJewelBonus, getLabBonus } from '../../../../parsers/lab';
import { CardTitleAndValue } from '@components/common/styles';

const Kitchens = ({
                    spices,
                    kitchens,
                    meals,
                    totalMealSpeed,
                    lastUpdated,
                    achievements,
                    lab,
                    equinoxUpgrades,
                    account
                  }) => {
  const calcTotals = (kitchens) => {
    return kitchens?.reduce((res, kitchen) => {
      const isCooking = kitchen?.status === 2;
      if (!isCooking) return res;
      const { meal } = kitchen;
      return {
        ...res,
        [meal?.rawName]: { total: (res[meal?.rawName]?.total ?? 0) + (kitchen?.mealSpeed / kitchen?.meal?.cookReq), ...meal }
      }
    }, {})
  }
  const totals = useMemo(() => calcTotals(kitchens), [kitchens]);

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

  return (
    <>
      <Stack my={2} direction={'row'} gap={1} flexWrap={'wrap'}>
        <CardTitleAndValue cardSx={{ my: 0, mb: 0 }} title={'Claims'}
                           value={`${spices?.numberOfClaims} / ${maxNumberOfSpiceClicks}`}/>
        {spices?.available?.map((spice, index) => {
          return spice ? <Card key={`${spice?.rawName}-${index}`}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Tooltip title={spice?.name}>
                <SpiceIcon src={`${prefix}data/${spice?.rawName}.png`} alt=""/>
              </Tooltip>
              <Tooltip title={parseInt(spice?.amount)}>
                <Typography>{notateNumber(parseInt(spice?.amount), 'Big')}</Typography>
              </Tooltip>
            </CardContent>
          </Card> : null;
        })}
      </Stack>
      <Typography variant={'h4'}>Totals</Typography>
      <Stack my={2} direction={'row'} gap={2} flexWrap={'wrap'}>
        {Object.entries((totals || {}))?.map(([foodName, meal], index) => {
          const { total } = meal;
          return <Card key={`${foodName}-${index}-${total}`}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Tooltip placement={'top'}
                       title={<MealTooltip achievements={achievements} totalMealSpeed={totalMealSpeed} meal={meal}
                                           lab={lab} equinoxUpgrades={equinoxUpgrades} account={account}/>}>
                <MealIcon src={`${prefix}data/${foodName}.png`} alt=""/>
              </Tooltip>
              <div>{notateNumber(total, 'Big')}/hr</div>
              <MealTooltip achievements={achievements} totalMealSpeed={totalMealSpeed} meal={meal} lab={lab}
                           equinoxUpgrades={equinoxUpgrades} account={account}/>
            </CardContent>
          </Card>
        })}
        <Card>
          <CardContent sx={{ height: '100%' }}>
            <Stack alignItems={'center'} gap={2} justifyContent={'center'}>
              <img src={`${prefix}etc/Kitchen.png`} alt=""/>
              <Typography>Total Speed</Typography>
              <Typography>{notateNumber(totalMealSpeed, 'Big')}/hr</Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Stack direction={'row'} sx={{ mt: 4 }} gap={3} flexWrap={'wrap'}>
        {kitchens?.map((kitchen, kitchenIndex) => {
          if (!kitchen) return null;
          const isRecipe = kitchen?.status >= 3;
          const recipeTime = getRecipeTime(kitchen?.possibleMeals);
          const percentOfCap = Math.round(kitchen?.currentProgress / recipeTime * 100);
          const timeToFinish = (recipeTime - kitchen?.currentProgress) / kitchen.fireSpeed;
          const [firstSpiceIndex, secondSpiceIndex, thirdSpiceIndex] = [0, 1,
            2].map((ind) => getSpiceForUpgrade(kitchenIndex, ind));
          return <Card key={`kitchen-${kitchenIndex}`} sx={{ width: { xs: 350, sm: 400 } }}>
            <CardContent sx={{ padding: 4 }}>
              <Stack direction={'row'} justifyContent={'center'}>
                <Stack>
                  <Typography sx={{ color: 'success.light' }}>Speed ({kitchen?.speedLv})</Typography>
                  <Typography>{notateNumber(kitchen?.mealSpeed, 'Big') ?? 0}/hr</Typography>
                  <Stack mt={2} alignItems={'center'}>
                    <Tooltip title={spicesNames[firstSpiceIndex]}>
                      <SpiceIcon src={`${prefix}data/CookingSpice${firstSpiceIndex}.png`} alt={''}/>
                    </Tooltip>
                    <Typography>{notateNumber(kitchen?.speedCost, 'Big')}</Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ mx: 2, backgroundColor: 'white' }} orientation="vertical" flexItem/>
                <Stack>
                  <Typography sx={{ color: 'error.light' }}>Fire ({kitchen?.fireLv})</Typography>
                  <Typography>{notateNumber(kitchen?.fireSpeed, 'Big') ?? 0}/hr</Typography>
                  <Stack mt={2} alignItems={'center'}>
                    <Tooltip title={spicesNames[secondSpiceIndex]}>
                      <SpiceIcon src={`${prefix}data/CookingSpice${secondSpiceIndex}.png`} alt={''}/>
                    </Tooltip>
                    <Typography>{notateNumber(kitchen?.fireCost, 'Big')}</Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ mx: 2, backgroundColor: 'white' }} orientation="vertical" flexItem/>
                <Stack>
                  <Typography sx={{ color: 'info.light' }}>Luck ({kitchen?.luckLv})</Typography>
                  <Typography>{kitchen?.mealLuck.toFixed(2) ?? 0}x</Typography>
                  <Stack mt={2} alignItems={'center'}>
                    <Tooltip title={thirdSpiceIndex >= 20 ? 'Unknown' : spicesNames[thirdSpiceIndex]}>
                      <SpiceIcon src={`${prefix}data/${thirdSpiceIndex >= 21
                        ? 'CookingSpiceNA'
                        : `CookingSpice${thirdSpiceIndex}`}.png`} alt={''}/>
                    </Tooltip>
                    <Typography>{notateNumber(kitchen?.luckCost, 'Big')}</Typography>
                  </Stack>
                </Stack>
              </Stack>
              {isRecipe ? <Stack>
                <Stack mt={4} mb={1} direction={'row'} justifyContent={'center'} alignItems={'center'} gap={2}>
                  <Typography variant={'body1'}>Spices: </Typography>
                  {kitchen?.spices?.map((spice, index) => {
                    if (spice === -1) return null;
                    return <SpiceIcon src={`${prefix}data/CookingSpice${spice}.png`} key={`${spice}-${index}`}
                                      alt={''}/>
                  })}
                </Stack>
                {kitchen?.possibleMeals?.length > 0 ?
                  <Stack direction={'row'} justifyContent={'center'} flexWrap={'wrap'} alignItems={'center'}
                         rowGap={1.5}>
                    {kitchen?.possibleMeals?.map((food, index) => <MealIcon
                      missing={meals?.[food?.index]?.level === 0}
                      key={`possible-${food?.rawName}-${index}`}
                      src={`${prefix}data/${food?.rawName}.png`}
                      alt=""/>)}
                  </Stack> : null}
                <Tooltip title={`${percentOfCap}%`}>
                  <ProgressBar percent={percentOfCap}/>
                </Tooltip>
                <Stack direction={'row'} gap={3} mt={1}>
                  <Typography variant={'body1'}
                              component={'span'}>{notateNumber(kitchen?.currentProgress, 'Big')} / {notateNumber(recipeTime, 'Big')}</Typography>
                  <Timer placeholder={<Typography sx={{ color: 'success.light' }}>Ready</Typography>}
                         type={'countdown'} date={new Date().getTime() + (timeToFinish * 1000 * 3600)}
                         lastUpdated={lastUpdated}/>
                </Stack>
              </Stack> : <Stack mt={2} justifyContent={'center'} alignItems={'center'}>
                <Tooltip placement={'top'}
                         title={<MealTooltip achievements={achievements} totalMealSpeed={totalMealSpeed}
                                             lab={lab}
                                             meal={kitchen?.meal} equinoxUpgrades={equinoxUpgrades}
                                             account={account}/>}>
                  <MealIcon src={`${prefix}data/${kitchen?.meal?.rawName}.png`} alt=""/>
                </Tooltip>
                <div>{notateNumber(kitchen?.mealSpeed / kitchen?.meal?.cookReq, 2)}/hr</div>
              </Stack>}
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};


const MealTooltip = ({ meal, lab, totalMealSpeed, achievements, equinoxUpgrades, account }) => {
  const timeToDiamond = calcMealTime(11, meal, totalMealSpeed, achievements, equinoxUpgrades, account);
  const levelCost = getMealLevelCost(meal?.level, achievements, account, equinoxUpgrades);
  const diamondCost = (11 - meal?.level) * levelCost;
  const timeTillNextLevel = meal?.amount >= levelCost
    ? '0'
    : calcTimeToNextLevel(levelCost - meal?.amount, meal?.cookReq, totalMealSpeed);
  const spelunkerObolMulti = getLabBonus(lab?.labBonuses, 8); // gem multi
  const blackDiamondRhinestone = getJewelBonus(lab?.jewels, 16, spelunkerObolMulti);
  const realEffect = (1 + (blackDiamondRhinestone + meal?.shinyMulti) / 100) * meal?.level * meal?.baseStat;
  return <>
    {meal?.level >= 11 || levelCost === diamondCost ? <>
      <Typography sx={{ textAlign: 'center' }}>Next Level in: <Timer
        date={new Date().getTime() + (timeTillNextLevel * 3600 * 1000)}
        staticTime={true}/>
      </Typography>
      <Typography>({notateNumber(meal?.amount, 'Big')} / {notateNumber(levelCost, 'Big')})</Typography></> : <>
      <Typography>Next Level in: <Timer date={new Date().getTime() + (timeTillNextLevel * 3600 * 1000)}
                                        staticTime={true}/></Typography>
      <Typography>Diamond plate
        in: <Timer date={new Date().getTime() + (timeToDiamond * 3600 * 1000)}
                   staticTime={true}/> </Typography>
      <Typography>({notateNumber(meal?.amount, 'Big')} / {notateNumber(diamondCost, 'Big')})</Typography>
    </>}
    <Typography
      fontSize={15}
      fontWeight={'bold'}>{cleanUnderscore(meal?.effect?.replace('{', kFormatter(realEffect)))}</Typography>
  </>;
}

const SpiceIcon = styled.img`
  object-fit: contain;
  width: 24px;
`;

const MealIcon = styled.img`
  object-fit: contain;
  margin-top: -20px;
  opacity: ${({ missing }) => missing ? 0.5 : 1}
`;

export default Kitchens;

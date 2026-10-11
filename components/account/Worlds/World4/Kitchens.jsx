import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { cleanUnderscore, kFormatter, notateNumber, prefix } from '@utility/helpers';
import Tooltip from 'components/Tooltip';
import Timer from 'components/common/Timer';
import TimeToHours from 'components/common/Timer/TimeToHours';
import React from 'react';
import {
  calcMealTime,
  calcTimeToNextLevel,
  getMealLevelCost,
  maxNumberOfSpiceClicks,
  spicesNames
} from '@parsers/world-4/cooking';
import styled from '@emotion/styled';
import ProgressBar from 'components/common/ProgressBar';
import { CardTitleAndValue } from '@components/common/styles';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { getMealBonus } from '@parsers/world-4/cooking';
import MealIcon, { MealHeader } from 'components/common/MealIcon';

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
  const totals = calcTotals(kitchens);

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
                <SpiceIcon src={`${prefix}data/${spice?.rawName}.png`} alt={spice?.rawName}/>
              </Tooltip>
              <Tooltip title={parseInt(spice?.amount)}>
                <Typography>{notateNumber(parseInt(spice?.amount), 'Big')}</Typography>
              </Tooltip>
            </CardContent>
          </Card> : null;
        })}
      </Stack>
      <Typography variant={'h5'}>Totals</Typography>
      <Stack my={2} direction={'row'} gap={2} flexWrap={'wrap'}>
        {Object.entries((totals || {}))?.map(([foodName, meal], index) => {
          const { total } = meal;
          return <Card key={`${foodName}-${index}-${total}`} sx={{ width: 300 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <MealHeader rawName={foodName} name={meal?.name} level={meal?.level}
                          subtitle={`${notateNumber(total, 'Big')}/hr`}/>
              <MealProgress achievements={achievements} totalMealSpeed={totalMealSpeed} meal={meal}
                            equinoxUpgrades={equinoxUpgrades} account={account}/>
            </CardContent>
          </Card>
        })}
        <Card sx={{ width: 300 }}>
          <CardContent>
            <Stack direction={'row'} alignItems={'center'} gap={1.5}>
              <KitchenIcon src={`${prefix}etc/Kitchen.png`} alt="Kitchen"/>
              <Stack>
                <Typography variant={'subtitle1'} sx={{ fontWeight: 'bold', lineHeight: 1.3 }}>Total Speed</Typography>
                <Typography variant={'body2'} color={'text.secondary'}>
                  {notateNumber(totalMealSpeed, 'Big')}/hr
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Stack direction={'row'} sx={{ mt: 4 }} gap={2} flexWrap={'wrap'}>
        {kitchens?.map((kitchen, kitchenIndex) => {
          if (!kitchen) return null;
          const isRecipe = kitchen?.status >= 3;
          const recipeTime = getRecipeTime(kitchen?.possibleMeals);
          const percentOfCap = Math.round(kitchen?.currentProgress / recipeTime * 100);
          const timeToFinish = (recipeTime - kitchen?.currentProgress) / kitchen.fireSpeed;
          const [firstSpiceIndex, secondSpiceIndex, thirdSpiceIndex] = [0, 1,
            2].map((ind) => getSpiceForUpgrade(kitchenIndex, ind));
          const luckSpice = thirdSpiceIndex >= 21 ? 'CookingSpiceNA' : `CookingSpice${thirdSpiceIndex}`;
          return <Card key={`kitchen-${kitchenIndex}`} sx={{ width: { xs: 350, sm: 380 } }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Stack direction={'row'} justifyContent={'space-between'}
                     divider={<Divider orientation={'vertical'} flexItem/>}>
                <KitchenUpgrade label={'Speed'} color={'success.light'} level={kitchen?.speedLv}
                                value={`${notateNumber(kitchen?.mealSpeed, 'Big') ?? 0}/hr`}
                                breakdown={kitchen?.mealSpeedBreakdown}
                                spice={`CookingSpice${firstSpiceIndex}`} spiceName={spicesNames[firstSpiceIndex]}
                                cost={kitchen?.speedCost}/>
                <KitchenUpgrade label={'Fire'} color={'error.light'} level={kitchen?.fireLv}
                                value={`${notateNumber(kitchen?.fireSpeed, 'Big') ?? 0}/hr`}
                                breakdown={kitchen?.fireSpeedBreakdown}
                                spice={`CookingSpice${secondSpiceIndex}`} spiceName={spicesNames[secondSpiceIndex]}
                                cost={kitchen?.fireCost}/>
                <KitchenUpgrade label={'Luck'} color={'info.light'} level={kitchen?.luckLv}
                                value={`${kitchen?.mealLuck?.toFixed(2) ?? 0}x`}
                                spice={luckSpice}
                                spiceName={thirdSpiceIndex >= 20 ? 'Unknown' : spicesNames[thirdSpiceIndex]}
                                cost={kitchen?.luckCost}/>
              </Stack>
              <Stack mt={'auto'} gap={1.5}>
                <Divider/>
                {isRecipe ? <>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <Typography variant={'body2'}><b>Spices:</b></Typography>
                    {kitchen?.spices?.map((spice, index) => {
                      if (spice === -1) return null;
                      return <SpiceIcon src={`${prefix}data/CookingSpice${spice}.png`} key={`${spice}-${index}`}
                                        alt={spice}/>
                    })}
                  </Stack>
                  {kitchen?.possibleMeals?.length > 0 ?
                    <Stack direction={'row'} flexWrap={'wrap'} alignItems={'center'} gap={.5}>
                      {kitchen?.possibleMeals?.map((food, index) => <Tooltip
                        key={`possible-${food?.rawName}-${index}`} title={cleanUnderscore(food?.name)}>
                        <Stack sx={{ opacity: meals?.[food?.index]?.level === 0 ? .5 : 1 }}>
                          <MealIcon rawName={food?.rawName} alt={food?.rawName} small/>
                        </Stack>
                      </Tooltip>)}
                    </Stack> : null}
                  <ProgressBar percent={percentOfCap}/>
                  <Stack direction={'row'} gap={2} alignItems={'center'}>
                    <Typography variant={'body2'} component={'span'}>
                      {notateNumber(kitchen?.currentProgress, 'Big')} / {notateNumber(recipeTime, 'Big')}
                    </Typography>
                    <Timer variant={'body2'}
                           placeholder={<Typography variant={'body2'} sx={{ color: 'success.light' }}>Ready</Typography>}
                           type={'countdown'} date={new Date().getTime() + (timeToFinish * 1000 * 3600)}
                           lastUpdated={lastUpdated}/>
                  </Stack>
                </> : <Stack direction={'row'} alignItems={'center'} gap={1.5}>
                    <MealIcon rawName={kitchen?.meal?.rawName} alt={kitchen?.meal?.rawName} small/>
                    <Stack>
                      <Typography variant={'body2'} sx={{ fontWeight: 'bold' }}>
                        {cleanUnderscore(kitchen?.meal?.name)}
                      </Typography>
                      <Typography variant={'body2'} color={'text.secondary'}>
                        {notateNumber(kitchen?.mealSpeed / kitchen?.meal?.cookReq, 2)}/hr
                      </Typography>
                    </Stack>
                  </Stack>}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};


const KitchenUpgrade = ({ label, color, level, value, breakdown, spice, spiceName, cost }) => {
  return <Stack gap={.5} sx={{ flex: 1, alignItems: 'center' }}>
    <Typography variant={'body2'} sx={{ color, fontWeight: 'bold' }}>{label} ({level})</Typography>
    <Stack direction={'row'} gap={.5} alignItems={'center'}>
      <Typography variant={'body2'}>{value}</Typography>
      {breakdown ? <Breakdown data={breakdown}>
        <IconInfoCircleFilled size={16} style={{ cursor: 'pointer', display: 'block' }}/>
      </Breakdown> : null}
    </Stack>
    <Stack direction={'row'} gap={.5} alignItems={'center'}>
      <Tooltip title={spiceName}>
        <SpiceIcon src={`${prefix}data/${spice}.png`} alt=""/>
      </Tooltip>
      <Typography variant={'body2'}>{notateNumber(cost, 'Big')}</Typography>
    </Stack>
  </Stack>
};

const MealProgress = ({ meal, totalMealSpeed, achievements, equinoxUpgrades, account }) => {
  const timeToDiamond = calcMealTime(11, meal, totalMealSpeed, achievements, equinoxUpgrades, account);
  const levelCost = getMealLevelCost(meal?.level, achievements, account, equinoxUpgrades);
  const diamondCost = (11 - meal?.level) * levelCost;
  const showDiamond = meal?.level < 11 && levelCost !== diamondCost;
  const isReady = meal?.amount >= levelCost;
  const timeTillNextLevel = isReady ? 0 : calcTimeToNextLevel(levelCost - meal?.amount, meal?.cookReq, totalMealSpeed);
  const realEffect = getMealBonus(account, meal).value;
  return <>
    <Typography variant={'body2'}>{cleanUnderscore(meal?.effect?.replace('{', kFormatter(realEffect)))}</Typography>
    <Stack gap={.5}>
      <Typography variant={'body2'}>
        <b>Next Level:</b> {isReady
        ? <Typography component={'span'} variant={'body2'} sx={{ color: 'success.light' }}>Ready</Typography>
        : <TimeToHours hours={timeTillNextLevel}/>}
      </Typography>
      {showDiamond ? <Typography variant={'body2'}>
        <b>Diamond Plate:</b> <TimeToHours hours={timeToDiamond}/>
      </Typography> : null}
      <Typography variant={'body2'}>
        <b>Progress:</b> {notateNumber(meal?.amount, 'Big')} / {notateNumber(showDiamond ? diamondCost : levelCost, 'Big')}
      </Typography>
    </Stack>
  </>;
}

const SpiceIcon = styled.img`
  object-fit: contain;
  width: 24px;
`;

const KitchenIcon = styled.img`
  flex-shrink: 0;
  height: 56px;
  object-fit: contain;
`;

export default Kitchens;

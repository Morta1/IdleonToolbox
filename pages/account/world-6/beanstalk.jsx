import React, { useCallback, useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { items, ninjaExtraInfo } from '../../../data/website-data';
import { addEquippedItems, findItemInInventory, getAllItems, mergeItemsByOwner } from '@parsers/items';
import Tooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/styles';
import ItemDisplay from '@components/common/ItemDisplay';
import { getGoldenFoodMulti } from '@parsers/misc';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const breakpoints = [10000, 100000];
const Beanstalk = () => {
  const { state } = useContext(AppContext);
  const beanstalkData = state?.account?.sneaking?.beanstalkData;
  const beanstalkGoldenFoods = ninjaExtraInfo[29].split(' ').filter((str) => isNaN(str))
    .map((gFood, index) => ({
      ...(items?.[gFood] || {}),
      rawName: gFood,
      active: beanstalkData?.[index] > 0,
      rank: beanstalkData?.[index],
      index
    }));
  const unlocked = isJadeBonusUnlocked(state?.account, 'Gold_Food_Beanstalk');
  const findItem = useCallback((name) => {
    const equippedItems = addEquippedItems(state?.characters, true);
    const totalItems = getAllItems(state?.characters, state?.account)
    const totalOwnedItems = mergeItemsByOwner([...(totalItems || []), ...(equippedItems || [])]);
    return findItemInInventory(totalOwnedItems, name)
  }, [state?.characters, state?.account]);
  const allCharactersMulti = state?.characters?.map((character) => {
    const multi = getGoldenFoodMulti(character, state?.account, state?.characters);
    return {
      name: character?.name,
      bonus: multi?.value,
      value: notateNumber(Math.max(0, 100 * (multi?.value - 1)), 'Small') + '%'
    }
  });
  allCharactersMulti.sort((a, b) => a.bonus - b.bonus);
  const allMultis = allCharactersMulti.map(({ bonus }) => bonus);
  const highestMulti = notateNumber(Math.max(0, 100 * (Math.max(...allMultis) - 1)), 'Small');
  return <>
    <NextSeo
      title="Beanstalk | Idleon Toolbox"
      description="Keep track on your golden food bonuses on the beanstalk"
    />
    <Stack direction={'row'} gap={1} alignItems={'center'}>
      <Typography variant={'h6'}>Total Golden Food Bonus: {highestMulti}%</Typography>
      <Tooltip title={<Breakdown breakdown={allCharactersMulti} titleStyle={{ width: 170 }}/>}>
        <IconInfoCircleFilled/>
      </Tooltip>
    </Stack>
    {!unlocked ? <Typography textAlign={'center'} mt={2} mb={2} variant={'caption'}>* You need to unlock beanstalk
      through W6
      jade emporium to get the beanstalk bonuses</Typography> : null}
    <Stack mt={2} direction={'row'} gap={1} flexWrap={'wrap'}>
      {beanstalkGoldenFoods?.map((item) => {
        const { displayName, rawName, active, rank } = item;
        const goldenFoods = findItem(displayName);
        const total = Object.values(goldenFoods).reduce((sum, { amount }) => sum + amount, 0);
        const breakdown = Object.entries(goldenFoods || {}).map(([playerName, { amount }]) => ({
          name: playerName,
          value: amount
        }));
        breakdown.sort((a, b) => a.value - b.value);
        const totalEntry = breakdown.reduce((sum, item) => sum + item.value, 0);
        breakdown.push({
          name: 'Total',
          value: totalEntry
        });

        return <Card key={rawName} sx={{ width: 270 }}>
          <CardContent>
            <Typography variant={'body1'}>{cleanUnderscore(displayName)}</Typography>
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
              <Tooltip
                title={displayName && displayName !== 'ERROR' ? <ItemDisplay {...item} character={state?.character}
                                                                             account={state?.account}/> : ''}>
                <img width={42} height={42} src={`${prefix}data/${rawName}.png`} alt={displayName}/>
              </Tooltip>
              <Stack direction={'row'} gap={1}>
                {breakpoints?.[rank] ? <Typography color={total >= breakpoints?.[rank]
                    ? 'success.light'
                    : ''}>{notateNumber(total)} / {notateNumber(breakpoints?.[rank])}</Typography> :
                  <Typography>Maxed</Typography>}
                <Tooltip title={<Breakdown breakdown={breakdown} titleStyle={{ width: 170 }}/>}>
                  <IconInfoCircleFilled size={22}/>
                </Tooltip>
              </Stack>

            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Beanstalk;

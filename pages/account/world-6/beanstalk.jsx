import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';
import { items, ninjaExtraInfo } from '@website-data';
import { addEquippedItems, findItemInInventory, getAllItems, mergeItemsByOwner } from '@parsers/items';
import Tooltip from '@components/Tooltip';
import { Breakdown } from '@components/common/styles';
import ItemDisplay from '@components/common/ItemDisplay';
import { BEANSTALK_BREAKPOINTS, getGoldenFoodMulti, getGoldenFoodBonus } from '@parsers/misc';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Beanstalk = () => {
  const { state } = useContext(AppContext);
  const beanstalkData = state?.account?.sneaking?.beanstalkData;
  const beanstalkGoldenFoods = ninjaExtraInfo[29].filter((str) => isNaN(str))
    .map((gFood, index) => ({
      ...(items?.[gFood] || {}),
      rawName: gFood,
      active: beanstalkData?.[index] > 0,
      rank: beanstalkData?.[index],
      index
    }));
  const unlocked = isJadeBonusUnlocked(state?.account, 'Gold_Food_Beanstalk');
  const findItem = (name) => {
    const equippedItems = addEquippedItems(state?.characters, true);
    const totalItems = getAllItems(state?.characters, state?.account)
    const totalOwnedItems = mergeItemsByOwner([...(totalItems || []), ...(equippedItems || [])]);
    return findItemInInventory(totalOwnedItems, name)
  };
  const allCharactersMulti = state?.characters?.map((character) => {
    const multi = getGoldenFoodMulti(character, state?.account, state?.characters);
    return {
      character,
      name: character?.name,
      bonus: multi?.value,
      value: notateNumber(Math.max(0, 100 * (multi?.value - 1)), 'Small') + '%'
    }
  }) ?? [];
  allCharactersMulti.sort((a, b) => a.bonus - b.bonus);
  // Sorted ascending, so the last entry is the best character. This page is account-wide and has no
  // character picker, so the per-food bonuses are shown for whoever gets the most out of them.
  const bestCharacter = allCharactersMulti.at(-1);
  const highestMulti = notateNumber(Math.max(0, 100 * ((bestCharacter?.bonus ?? 1) - 1)), 'Small');
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
                title={displayName && displayName !== 'ERROR' ?
                  <ItemDisplay {...item} character={bestCharacter?.character}
                               account={state?.account}
                               characters={state?.characters}
                               getGoldenFoodBonus={getGoldenFoodBonus}/> : ''}>
                <img width={42} height={42} src={`${prefix}data/${rawName}.png`} alt={displayName}/>
              </Tooltip>
              <Stack direction={'row'} gap={1}>
                {BEANSTALK_BREAKPOINTS?.[rank] ? <Typography color={total >= BEANSTALK_BREAKPOINTS?.[rank]
                    ? 'success.light'
                    : ''}>{notateNumber(total)} / {notateNumber(BEANSTALK_BREAKPOINTS?.[rank])}</Typography> :
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

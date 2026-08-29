import { useContext, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { cleanUnderscore, numberWithCommas, prefix } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import ItemDisplay from '@components/common/ItemDisplay';
import AutoGrid from '@components/common/AutoGrid';
import { CardTitleAndValue } from '@components/common/styles';
import EmptyState from '@components/common/EmptyState';
import useTabIndex from '@hooks/useTabIndex';

const tabs = [1, 2, 3, 4, 5, 6].map((ind) => `Tab ${ind}`);
import { getGoldenFoodBonus } from '@parsers/misc';

const Tasks = () => {
  const { state } = useContext(AppContext);
  const [world] = useTabIndex(tabs);
  const [hideCompleted, setHideCompleted] = useState(false);

  const worldUnlocks = state?.account?.taskUnlocks?.taskUnlocksList?.[world] ?? [];
  const visibleUnlocks = worldUnlocks.filter(({ unlocked }) => !(hideCompleted && unlocked));

  return (<>
    <NextSeo
      title="Task Unlocks | Idleon Toolbox"
      description="Track your task board unlock progression, merit rewards, and task tier requirements in Legends of Idleon"
    />
    <Stack mb={3} direction={'row'} alignItems={'center'} gap={2}>
      <CardTitleAndValue title={'Available unlocks'}
                         value={Math.max(0, state?.account?.taskUnlocks?.unlockPointsOwned - state?.account?.taskUnlocks?.unlockedRecipes) + ''}/>
      <CardTitleAndValue title={'Next unlock'}
                         value={`${numberWithCommas(state?.account?.taskUnlocks?.currentPoints)} / ${numberWithCommas(state?.account?.taskUnlocks?.pointsReq)} `}/>
      <CardTitleAndValue title={'Unlocked recipes'} value={state?.account?.taskUnlocks?.unlockedRecipes}/>
      <FormControlLabel
        control={<Checkbox checked={hideCompleted}
                           onChange={(e) => setHideCompleted(e.target.checked)}/>}
        label={'Hide completed'}/>
    </Stack>
    <Tabber tabs={tabs} keepChildren>
      <Stack index={world} direction={'row'} flexWrap={'wrap'} gap={3} justifyContent={'center'}>
        {visibleUnlocks?.length === 0
          ? <EmptyState hideCompleted={hideCompleted && worldUnlocks.length > 0} label={'unlocks'}/>
          : null}
        {visibleUnlocks?.map(({ unlocks, unlocked }, index) => {
          return <Card key={'key' + index}>
            <CardContent sx={{
              opacity: unlocked ? 1 : .5,
              border: unlocked ? '1px solid' : '',
              borderColor: unlocked ? 'success.main' : '',
              height: '100%'
            }}>
              <AutoGrid>
                {unlocks?.map((item, itemIndex) => {
                  if (!item?.rawName) return null;
                  return <Stack key={item?.rawName + itemIndex} direction={'row'} alignItems={'center'} gap={2}>
                    <Tooltip title={<ItemDisplay {...item} account={state?.account} getGoldenFoodBonus={getGoldenFoodBonus}/>}>
                      <img style={{ width: 32 }} src={`${prefix}data/${item?.rawName}.png`}
                           alt={'item' + index + itemIndex}/>
                    </Tooltip>
                    <Typography>{item?.amount > 0 ? item?.amount : ''} {cleanUnderscore(item?.displayName)}</Typography>
                  </Stack>
                })}
              </AutoGrid>
            </CardContent>
          </Card>
        })}
      </Stack>
    </Tabber>
  </>);
};

export default Tasks;

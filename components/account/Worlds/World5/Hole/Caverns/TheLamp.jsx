import { CardTitleAndValue } from '@components/common/styles';
import { Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation } from '@utility/helpers';
import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import UpgradeCard, { LabelValue } from '@components/common/UpgradeCard';

const TheLamp = ({ hole }) => {
  const { theLamp } = hole?.caverns;

  return <>
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Wishes'}
                         value={theLamp?.currentWishes}/>
      <CardTitleAndValue title={'Wish per day'}
                         value={Math.round(100 * theLamp?.wishPerDay) / 100}/>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[6] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {theLamp?.wishes?.map(({ description, name, futureCosts, cost }, index) => {
        return <UpgradeCard key={`wish-${index}`}
                            title={cleanUnderscore(name)}
                            footer={<Stack direction={'row'} alignItems={'center'} gap={.5}>
              <LabelValue label={'Cost'}>{cost}</LabelValue>
              <Tooltip title={<Stack>
                <Typography variant={'body2'} style={{fontWeight:'bold'}}> Future costs</Typography>
                {futureCosts.map((futureCost, costIndex) => <div
                  key={`fc-${costIndex}`}>{commaNotation(futureCost)}</div>)}
              </Stack>}>
                <InfoIcon fontSize={'small'}/>
              </Tooltip>
            </Stack>}>
          <Stack gap={.5}>
            {cleanUnderscore(description).split('@').map((line) => line.trim()).filter(Boolean).map((line, lineIndex) => <Typography
              key={`wish-${index}-line-${lineIndex}`} variant={'body2'}>{line}</Typography>)}
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
  </>;
};

export default TheLamp;

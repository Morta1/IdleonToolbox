import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import { getSoulsReward } from '@parsers/worship';

const Totems = () => {
  const { state } = useContext(AppContext);
  const [worshipEff, setWorshipEff] = useState(0);
  const [foodEff, setFoodEff] = useState(0);

  return (
    <>
      <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
        <TextField size={'small'} value={worshipEff} onChange={({ target }) => setWorshipEff(target.value)}
                   label={'Worship Efficiency'}/>
        <TextField size={'small'} value={foodEff} onChange={({ target }) => setFoodEff(target.value)}
                   label={'Food Effect'}/>
      </Stack>
      <Stack direction={'row'} gap={2} sx={{ width: 'fit-content' }} flexWrap={'wrap'}>
        {state?.account?.totems?.map((totem, index) => {
          const { name, maxWave, expReward, map, chargeReq, minEfficiency } = totem;
          return <Card key={name} sx={{ md: { minWidth: 500 } }}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
                <TotemImg src={`${prefix}etc/totem_${index}.png`} alt={'totem' + index}/>
                <Stack direction={'row'} gap={4} flexWrap={'wrap'}>
                  <CardTitleAndValue title={'Name'} value={cleanUnderscore(index === 5 ? 'Citric Conflict' : index === 6 ? 'Breezy Battle' : name)}/>
                  <CardTitleAndValue title={'Map name'} value={cleanUnderscore(map)}/>
                  <CardTitleAndValue title={'Max Wave'} value={maxWave}/>
                  <CardTitleAndValue title={'Exp Per Charge'} value={Math.floor(expReward / chargeReq)}/>
                  <CardTitleAndValue title={'Min eff. for souls bonus'} value={minEfficiency}/>
                  <CardTitleAndValue title={'Souls'}
                                     value={getSoulsReward({ ...totem, efficiency: worshipEff, foodEffect: foodEff })}/>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>

    </>
  );
};

const TotemImg = styled.img`
  width: 75px;
  height: 75px;
`

const CardTitleAndValue = ({ title, value, children }) => {
  return <Stack sx={{ width: 130 }}>
    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
    {value ? <Typography>{value}</Typography> : children}
  </Stack>
}

export default Totems;

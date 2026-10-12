import React, { useContext, useState } from 'react';
import { AppContext } from '../../../../common/context/AppProvider';
import { Card, CardContent, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, prefix } from '@utility/helpers';
import styled from '@emotion/styled';
import { getSoulsBonuses, getSoulsReward, getTotemExpReward } from '@parsers/world-3/worship';
import { getBestActiveCharacter } from '@parsers/talents';
import { CardTitleAndValue as StatCard } from '@components/common/styles';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Totems = () => {
  const { state } = useContext(AppContext);
  const [worshipEff, setWorshipEff] = useState(0);
  const [foodEff, setFoodEff] = useState(0);
  const [selectedName, setSelectedName] = useState(null);
  const soulsBonuses = getSoulsBonuses(state?.account, state?.characters);
  const characters = state?.characters ?? [];
  // A wave's EXP uses the Worship EXP multi of the character fighting it, the logged-in one by default
  const worshipper = characters.find(({ name }) => name === selectedName) ?? getBestActiveCharacter(characters) ?? characters[0];

  return (
    <>
      <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
        <TextField size={'small'} value={worshipEff} onChange={({ target }) => setWorshipEff(target.value)}
                   label={'Worship Efficiency'}/>
        <TextField size={'small'} value={foodEff} onChange={({ target }) => setFoodEff(target.value)}
                   label={'Food Effect'}/>
        {characters.length ? <FormControl size={'small'} sx={{ minWidth: 180 }}>
          <InputLabel id={'totem-worshipper-label'}>Worshipper</InputLabel>
          <Select labelId={'totem-worshipper-label'} label={'Worshipper'} value={worshipper?.name ?? ''}
                  onChange={({ target }) => setSelectedName(target.value)}>
            {characters.map(({ name, classIndex }) => <MenuItem key={name} value={name}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt={''} width={24} height={24}/>
                <Typography>{name}</Typography>
              </Stack>
            </MenuItem>)}
          </Select>
        </FormControl> : null}
        <StatCard title={'Total Max Waves'} icon={'etc/totem_0.png'} imgStyle={{ width: 24, height: 24 }}
                  value={commaNotation(state?.account?.towers?.totalWaves ?? 0)}/>
      </Stack>
      <Stack direction={'row'} gap={2} sx={{ width: 'fit-content' }} flexWrap={'wrap'}>
        {state?.account?.totems?.map((totem, index) => {
          const { name, maxWave, map, chargeReq, minEfficiency } = totem;
          const expReward = getTotemExpReward(totem, index, worshipper, characters, state?.account);
          return <Card key={name ?? index} sx={{ md: { minWidth: 500 } }}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={2} flexWrap={'wrap'}>
                <TotemImg src={`${prefix}etc/totem_${index}.png`} alt={'totem' + index}/>
                <Stack mb={3} direction={'row'} gap={4} flexWrap={'wrap'}>
                  <CardTitleAndValue title={'Name'} value={cleanUnderscore(index === 5 ? 'Citric Conflict' : index === 6 ? 'Breezy Battle' : index === 7 ? 'Pufferblob Brawl' : name)}/>
                  <CardTitleAndValue title={'Map name'} value={cleanUnderscore(map)}/>
                  <CardTitleAndValue title={'Max Wave'} value={maxWave || '0'}/>
                  <CardTitleAndValue title={'Exp Per Wave'}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <Typography>{commaNotation(expReward.value)}</Typography>
                      <Breakdown data={expReward.breakdown}>
                        <Stack justifyContent={'center'}>
                          <IconInfoCircleFilled size={18}/>
                        </Stack>
                      </Breakdown>
                    </Stack>
                  </CardTitleAndValue>
                  <CardTitleAndValue title={'Exp Per Charge'} value={commaNotation(Math.floor(expReward.value / chargeReq)) || '0'}/>
                  <CardTitleAndValue title={'Min eff. for souls bonus'} value={commaNotation(minEfficiency)}/>
                  <CardTitleAndValue title={'Souls'}
                                     value={getSoulsReward({ ...totem, efficiency: worshipEff, foodEffect: foodEff, bonuses: soulsBonuses }) || '0'}/>
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

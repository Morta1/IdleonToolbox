import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, numberWithCommas, prefix } from '../../../../../utility/helpers';
import { CardTitleAndValue } from '../../../../common/styles';
import Tabber from '../../../../common/Tabber';
import Imports from './Imports';
import Mutations from './Mutations';

const General = ({
                   account,
                   lastUpdated
                 }) => {
  const {
    bits,
    availableSprouts,
    availableDrops,
    sproutsCapacity,
    fertilizerUpgrades,
    envelopes,
    bestNugget
  } = account?.gaming;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <ImgCard title={'Bits'} imgSrc={`etc/Bits_${getBitIndex(bits)}`} value={notateNumber(bits, 'bits')}/>
      <ImgCard title={'Sprouts'} imgSrc={'etc/Sprouts'} value={`${availableSprouts} / ${sproutsCapacity ?? 0}`}/>
      <ImgCard title={'Best nugget'} imgSrc={'etc/GamingNugget'} value={numberWithCommas(parseInt(bestNugget))}/>
      <ImgCard title={'Drops'} imgSrc={'etc/GamingDrop'} value={availableDrops}/>
      <ImgCard title={'Envelopes'} imgSrc={'etc/GamingEnvelope'} value={envelopes}/>
    </Stack>

    <Stack mt={2} mb={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {fertilizerUpgrades?.map(({ name, level, description, cost }) => {
        return <Card key={name} sx={{ width: 250 }}>
          <CardContent>
            <Stack direction={'row'} gap={2}>
              <Typography sx={{ width: 120 }}>{cleanUnderscore(name)}</Typography>
              <Typography>Lv. {level}</Typography>
            </Stack>
            <Typography mt={1}>{cleanUnderscore(description)}</Typography>
            <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
              <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
              <Typography>{cost}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Tabber tabs={['Imports', 'Mutations']}>
      <Imports account={account} lastUpdated={lastUpdated}/>
      <Mutations account={account} lastUpdated={lastUpdated}/>
    </Tabber>
  </>
};


const ImgCard = ({ title, imgSrc, value }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction={'row'} gap={2}>
      <img src={`${prefix}${imgSrc}.png`} alt=""/>
      <Typography>{value}</Typography>
    </Stack>
  </CardTitleAndValue>
}

export default General;

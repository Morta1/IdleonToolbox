import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Imports from './Imports';
import Mutations from './Mutations';
import LogBook from '@components/account/Worlds/World5/Gaming/LogBook';
import Superbits from '@components/account/Worlds/World5/Gaming/Superbits';

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
    bestNugget,
    superbitsUpgrades,
    logBook
  } = account?.gaming;
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <ImgCard title={'Bits'} imgSrc={`etc/Bits_${getBitIndex(bits)}`} value={notateNumber(bits, 'bits')}/>
      <ImgCard title={'Sprouts'} imgSrc={'etc/Sprouts'} value={`${availableSprouts} / ${sproutsCapacity ?? 0}`}/>
      <ImgCard title={'Best nugget'} imgSrc={'etc/GamingNugget'} value={numberWithCommas(parseInt(bestNugget))}/>
      <ImgCard title={'Drops'} imgSrc={'etc/GamingDrop'} value={availableDrops}/>
      <ImgCard title={'Envelopes'} imgSrc={'etc/GamingEnvelope'} value={envelopes}/>
      <ImgCard title={'Log book'} imgSrc={'data/GamingPlanth5'} value={`${logBook?.length} / 72`}/>
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
    <Tabber tabs={['Imports', 'Superbits', 'Mutations', 'Log book']}>
      <Imports account={account} lastUpdated={lastUpdated}/>
      <Superbits superbits={superbitsUpgrades}/>
      <Mutations account={account} lastUpdated={lastUpdated}/>
      <LogBook logBook={account?.gaming?.logBook}/>
    </Tabber>
  </>
};


const ImgCard = ({ title, imgSrc, value }) => {
  return <CardTitleAndValue title={title}>
    <Stack direction={'row'} gap={2}>
      <img style={{ width: 24, height: 24 }} src={`${prefix}${imgSrc}.png`} alt=""/>
      <Typography>{value}</Typography>
    </Stack>
  </CardTitleAndValue>
}

export default General;

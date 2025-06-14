import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getBitIndex, getTabs, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import Imports from './Imports';
import Mutations from './Mutations';
import LogBook from '@components/account/Worlds/World5/Gaming/LogBook';
import Superbits from '@components/account/Worlds/World5/Gaming/Superbits';
import { PAGES } from '@components/constants';
import { getBitsMulti } from '@parsers/gaming';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';

const General = ({ account, characters, lastUpdated }) => {
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
  const ownedLogBooks = logBook?.reduce((sum, { unlocked }) => sum + (unlocked ? 1 : 0), 0);
  const bitMulti = getBitsMulti(account, characters);

  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Bits'} value={notateNumber(bits, 'bits')} icon={`etc/Bits_${getBitIndex(bits)}.png`}/>
      <CardWithBreakdown title={'Bit Multi'} value={`${notateNumber(bitMulti?.value)}x`} breakdown={bitMulti?.breakdown} notation={'MultiplierInfo'}/>
      <CardTitleAndValue title={'Sprouts'} value={`${availableSprouts} / ${sproutsCapacity ?? 0}`}
                         icon={'etc/Sprouts.png'}/>
      <CardTitleAndValue title={'Best Nugget'} icon={'etc/GamingNugget.png'}
                         value={numberWithCommas(parseFloat(bestNugget), false)}/>
      <CardTitleAndValue title={'Drops'} value={availableDrops} icon={`etc/GamingDrop.png`}/>
      <CardTitleAndValue title={'Envelopes'} value={notateNumber(envelopes)} icon={`etc/GamingEnvelope.png`}/>
      <CardTitleAndValue title={'Log book'} value={`${ownedLogBooks} / 72`} icon={`data/GamingPlanth5.png`}
                         imgStyle={{ width: 24, height: 24 }}/>
    </Stack>

    <Stack mt={2} mb={3} direction={'row'} flexWrap={'wrap'} gap={2}>
      {fertilizerUpgrades?.map(({ name, level, description, cost }) => {
        return <Card key={name} sx={{ width: 250 }}>
          <CardContent>
            <Stack direction={'row'} gap={2} justifyContent={'space-between'}>
              <Typography variant={'body1'} sx={{ width: 120 }}>{cleanUnderscore(name)}</Typography>
              <Typography variant={'body1'}>Lv. {level}</Typography>
            </Stack>
            <Typography variant={'body2'} mt={1}>{cleanUnderscore(description)}</Typography>
            <Stack mt={1} direction={'row'} gap={1} alignItems={'center'}>
              <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`} alt="" style={{ objectFit: 'contain' }}/>
              <Typography >{notateNumber(cost, 'bits')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'gaming')}>
      <Imports account={account} lastUpdated={lastUpdated}/>
      <Superbits superbits={superbitsUpgrades}/>
      <Mutations account={account} lastUpdated={lastUpdated}/>
      <LogBook logBook={account?.gaming?.logBook} ownedLogBooks={ownedLogBooks}/>
    </Tabber>
  </>
};

export default General;

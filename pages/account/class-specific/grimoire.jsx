import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, commaNotation, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { NextSeo } from 'next-seo';


const boneNames= [
  'Femur',
  'Ribcage',
  'Cranium',
  'Bovinae'
];
const Grimoire = () => {
  const { state } = useContext(AppContext);
  const { bones, upgrades, totalUpgradeLevels, nextUnlock, wraith } = state?.account?.grimoire;

  return <>
    <NextSeo
      title="Grimoire | Idleon Toolbox"
      description="Keep track of your grimoire levels, upgrades and wraith stats"
    />
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Levels'} value={totalUpgradeLevels}/>
      <CardTitleAndValue title={'Next upgrade'} value={<Tooltip title={<Stack gap={1}>
        <Typography sx={{ fontWeight: 'bold' }}>{cleanUnderscore(nextUnlock?.name)}</Typography>
        <Typography>{cleanUnderscore(nextUnlock?.description)}</Typography>
      </Stack>}>
        <Stack direction={'row'} gap={1}>
          {nextUnlock?.unlockLevel}
          <InfoIcon/>
        </Stack>
      </Tooltip>}/>
      {bones?.map((amount, index) => <CardTitleAndValue key={index} value={commaNotation(amount || '0')}
                                                        title={`${boneNames[index]}`}
                                                        icon={`data/Bone${index}_x1.png`}
                                                        imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ my: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Wraith Max HP'} value={notateNumber(wraith?.hp)}/>
      <CardTitleAndValue title={'Wraith Damage'} value={notateNumber(wraith?.damage)}/>
      <CardTitleAndValue title={'Wraith Accuracy'} value={notateNumber(wraith?.accuracy)}/>
      <CardTitleAndValue title={'Wraith Defence'} value={notateNumber(wraith?.defence)}/>
      <CardTitleAndValue title={'Wraith Crit Chance *'} value={`${wraith?.critChance}%`}/>
      <CardTitleAndValue title={'Wraith Crit Damage *'}
                         value={`${notateNumber(wraith?.critDamage, 'MultiplierInfo')}x`}/>
      <CardTitleAndValue title={'Wraith Base Extra Bones'}
                         value={`${notateNumber(wraith?.extraBones, 'MultiplierInfo')}x`}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {upgrades?.map(({
                        name,
                        cost,
                        description,
                        bonus,
                        monsterProgress,
                        boneType,
                        unlockLevel,
                        level,
                        unlocked,
                        x4
                      }, index) => {
        if (name === 'Ripped_Page') return null;
        return (
          (<Card key={name + index}>
            <CardContent sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 370,
              minHeight: 250,
              height: '100%',
              opacity: unlocked ? 1 : .5
            }}>
              <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
                <img style={{ width: 32, height: 32 }} src={`${prefix}data/GrimoireUpg${index}.png`}/>
                <Typography>{cleanUnderscore(name.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(#)', ''))} ({numberWithCommas(level)} / {numberWithCommas(x4)})</Typography>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Typography>{cleanUnderscore(description.replace('$', ` ${cleanUnderscore(monsterProgress)}`).replace('.00', ''))}</Typography>
              <Divider sx={{ my: 1 }}/>
              <Stack direction={'row'} gap={1} flexWrap={'wrap'} alignItems={'center'}>
                <img style={{ objectPosition: '0 -6px' }} src={`${prefix}data/Bone${boneType}_x1.png`}/>
                <Typography>Cost: {notateNumber(bones?.[boneType] || 0)} / {notateNumber(cost, 'Big')}</Typography>
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Typography>Unlocks at: {commaNotation(unlockLevel)} levels</Typography>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>;
};

export default Grimoire;

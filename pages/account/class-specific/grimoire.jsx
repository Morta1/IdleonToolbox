import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, commaNotation, getTabs, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Grimoire/Upgrades';
import Monsters from '@components/account/Misc/class-specific/Grimoire/Monsters';
import { boneNames } from '@parsers/grimoire';

const Grimoire = () => {
  const { state } = useContext(AppContext);
  const { bones, upgrades, monsterDrops, totalUpgradeLevels, nextUnlock, wraith } = state?.account?.grimoire;

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
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'grimoire')}>
      <Upgrades upgrades={upgrades} bones={bones} />
      <Monsters monsters={monsterDrops}/>
    </Tabber>

  </>;
};

export default Grimoire;

import { Divider, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, commaNotation, getTabs, notateNumber } from '@utility/helpers';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Grimoire/Upgrades';
import Monsters from '@components/account/Misc/class-specific/Grimoire/Monsters';
import { boneNames, getWraithStats } from '@parsers/grimoire';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Grimoire/UpgradeOptimizer';
import { checkCharClass, CLASSES } from '@parsers/talents';

const Grimoire = () => {
  const { state } = useContext(AppContext);
  const { bones, upgrades, monsterDrops, totalUpgradeLevels, nextUnlock } = state?.account?.grimoire;
  const [selectedChar, setSelectedChar] = useState(0);
  const deathBringers = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Death_Bringer));
  const wraithStats = useMemo(() => getWraithStats(state?.characters?.[selectedChar], state?.account), [selectedChar]);

  useEffect(() => {
    if (deathBringers.length === 1) {
      setSelectedChar(deathBringers?.[0]?.playerId);
    }
  }, []);

  return <>
    <NextSeo
      title="Grimoire | Idleon Toolbox"
      description="Keep track of your grimoire levels, upgrades and wraith stats"
    />
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Levels'} value={totalUpgradeLevels}/>
      {nextUnlock?.name ? <CardTitleAndValue title={'Next upgrade'} value={<Tooltip title={<Stack gap={1}>
        <Typography sx={{ fontWeight: 'bold' }}>{cleanUnderscore(nextUnlock?.name?.replace(/[船般航舞製]/, '').replace('(Tap_for_more_info)', '').replace('(#)', ''))}</Typography>
        <Typography>{cleanUnderscore(nextUnlock?.description)}</Typography>
      </Stack>}>
        <Stack direction={'row'} gap={1}>
          {nextUnlock?.unlockLevel}
          <InfoIcon/>
        </Stack>
      </Tooltip>}/> : null}
      {bones?.map((amount, index) => <CardTitleAndValue key={index} value={commaNotation(amount || '0')}
                                                        title={`${boneNames[index]}`}
                                                        icon={`data/Bone${index}_x1.png`}
                                                        imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ my: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Wraith Max HP'} value={notateNumber(wraithStats?.hp)}/>
      <CardTitleAndValue title={'Wraith Damage'} value={notateNumber(wraithStats?.damage)}/>
      <CardTitleAndValue title={'Wraith Accuracy'} value={notateNumber(wraithStats?.accuracy)}/>
      <CardTitleAndValue title={'Wraith Defence'} value={notateNumber(wraithStats?.defence)}/>
      <CardTitleAndValue title={'Wraith Crit Chance *'} value={`${wraithStats?.critChance}%`}/>
      <CardTitleAndValue title={'Wraith Crit Damage *'}
                         value={`${notateNumber(wraithStats?.critDamage, 'MultiplierInfo')}x`}/>
      <CardTitleAndValue title={'Wraith Base Extra Bones'}
                         value={`${notateNumber(wraithStats?.extraBones, 'MultiplierInfo')}x`}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'grimoire')}>
      <Upgrades upgrades={upgrades} bones={bones}/>
      <UpgradeOptimizer account={state?.account} character={state?.characters?.[selectedChar]}/>
      <Monsters monsters={monsterDrops}/>
    </Tabber>

  </>;
};

export default Grimoire;

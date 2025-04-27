import { Divider, Select, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { commaNotation, getTabs, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/Compass/Upgrades';
import Abominations from '@components/account/Misc/Compass/Abominations';
import Medallions from '@components/account/Misc/Compass/Medallions';
import Portals from '@components/account/Misc/Compass/Portals';
import { getCompassStats, getExtraDust } from '@parsers/compass';
import { checkCharClass } from '@parsers/talents';
import MenuItem from '@mui/material/MenuItem';

const Compass = () => {
  const { state } = useContext(AppContext);
  const {
    groupedUpgrades,
    abominations,
    dusts,
    medallions,
    maps,
    usedExaltedStamps,
    remainingExaltedStamps,
    totalUpgradeLevels,
    totalDustsCollected,
    totalAcquiredMedallions
  } = state?.account?.compass || {};
  const [selectedChar, setSelectedChar] = useState(0);
  const windWalkers = state?.characters?.filter((character) => checkCharClass(character?.class, 'Wind_Walker'));
  const tempestStats = useMemo(() => getCompassStats(state?.characters?.[selectedChar], state?.account), [selectedChar]);

  useEffect(() => {
    if (windWalkers.length === 1) {
      setSelectedChar(windWalkers?.[0]?.playerId);
    }
  }, []);

  return <>
    <NextSeo
      title="Compass | Idleon Toolbox"
      description="Keep track of your compass levels, upgrades and compass stats"
    />
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {windWalkers.length > 1 ? <CardTitleAndValue title={'Character'}
                                                   value={<Select size={'small'} value={selectedChar}
                                                                  onChange={(e) => setSelectedChar(e.target.value)}>
                                                     {windWalkers?.map((character, index) => {
                                                       return <MenuItem key={character?.name + index}
                                                                        value={character?.playerId}
                                                                        selected={selectedChar === character?.playerId}>
                                                         <Stack direction={'row'} alignItems={'center'} gap={2}>
                                                           <img
                                                             src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                                                             alt="" width={32} height={32}/>
                                                           <Typography>{character?.name}</Typography>
                                                         </Stack>
                                                       </MenuItem>
                                                     })}
                                                   </Select>}/> : null}
      <CardTitleAndValue title={'Total levels'} value={totalUpgradeLevels}/>
      <CardTitleAndValue title={'Extra Dust'} value={`${getExtraDust(selectedChar, state?.account)}%`}
                         tooltipTitle={'Not including Spirit Reindeer kills'}/>
      <CardTitleAndValue title={'Total dust collected'} value={numberWithCommas(totalDustsCollected)}/>
      <CardTitleAndValue title={'Exalted stamps'}
                         icon={'etc/Exalted_Stamp_Frame.png'}
                         imgStyle={{ width: 40, height: 40 }}
                         value={`${remainingExaltedStamps} / ${usedExaltedStamps + remainingExaltedStamps}`}/>
      {dusts?.map((amount, index) => <CardTitleAndValue key={index} value={commaNotation(amount || '0')}
                                                        title={`Dust ${index + 1}`}
                                                        icon={`data/Dust${index}_x1.png`}
                                                        imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Hp'} value={notateNumber(tempestStats?.hp, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Damage'} value={numberWithCommas(tempestStats?.damage.toFixed(2))}/>
      <CardTitleAndValue title={'Accuracy'}
                         value={notateNumber(tempestStats?.accuracy, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Defence'}
                         value={notateNumber(tempestStats?.defence, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Mastery'}
                         value={notateNumber(tempestStats?.mastery, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Crit pct'}
                         value={notateNumber(tempestStats?.critPct, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Crit damage'}
                         value={notateNumber(tempestStats?.critDamage, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Attack speed'}
                         value={notateNumber(tempestStats?.attackSpeed, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Invulnerable time'}
                         value={notateNumber(tempestStats?.invulnerableTime, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Range'}
                         value={notateNumber(tempestStats?.range, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Move speed'}
                         value={notateNumber(tempestStats?.moveSpeed, 'MultiplierInfo').replace('.00', '')}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'compass')}>
      <Upgrades upgrades={groupedUpgrades} dusts={dusts}/>
      <Abominations abominations={abominations}/>
      <Medallions medallions={medallions} totalAcquiredMedallions={totalAcquiredMedallions}/>
      <Portals maps={maps}/>
    </Tabber>
  </>;
};

export default Compass;

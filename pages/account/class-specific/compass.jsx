import { Divider, Select, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, commaNotation, getTabs, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Compass/Upgrades';
import Abominations from '@components/account/Misc/class-specific/Compass/Abominations';
import Medallions from '@components/account/Misc/class-specific/Compass/Medallions';
import Portals from '@components/account/Misc/class-specific/Compass/Portals';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Compass/UpgradeOptimizer';
import { getCompassStats, getExtraDust } from '@parsers/compass';
import { checkCharClass, CLASSES } from '@parsers/talents';
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
    totalAcquiredMedallions,
    topOfTheMorninKills
  } = state?.account?.compass || {};
  const [selectedChar, setSelectedChar] = useState(0);
  const windWalkers = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Wind_Walker));
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
      <CardTitleAndValue title={'Extra Dust'}
                         value={`${getExtraDust(state?.characters?.[selectedChar], state?.account).toFixed(2)}%`}
                         tooltipTitle={'Not including Spirit Reindeer kills'}/>
      <CardTitleAndValue title={'Total dust collected'} value={totalDustsCollected < 1e8
        ? numberWithCommas(totalDustsCollected || '0')
        : notateNumber(totalDustsCollected || 0)}/>
      <CardTitleAndValue title={'Exalted stamps'}
                         icon={'etc/Exalted_Stamp_Frame.png'}
                         imgStyle={{ width: 40, height: 40 }}
                         value={`${remainingExaltedStamps} / ${usedExaltedStamps + remainingExaltedStamps}`}/>
      <CardTitleAndValue title={'TOTM Kills'}
                         value={topOfTheMorninKills}/>
      {dusts?.map(({ value, name }, index) => <CardTitleAndValue key={index} value={value < 1e8
        ? commaNotation(value || '0')
        : notateNumber(value || 0)}
                                                                 title={name}
                                                                 icon={`data/Dust${index}_x1.png`}
                                                                 imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Hp'} value={numberWithCommas(Math.floor(tempestStats?.hp)).replace('.00', '')}/>
      <CardTitleAndValue title={'Damage'} value={tempestStats?.damage < 1e8
        ? numberWithCommas(Math.floor(tempestStats?.damage) || '0')
        : notateNumber(tempestStats?.damage || 0)}/>
      <CardTitleAndValue title={'Accuracy'}
                         value={tempestStats?.accuracy < 1e8
                           ? numberWithCommas(Math.floor(tempestStats?.accuracy) || '0')
                           : notateNumber(tempestStats?.accuracy || 0).replace('.00', '')}/>
      <CardTitleAndValue title={'Defence'}
                         value={tempestStats?.defence < 1e8
                           ? numberWithCommas(Math.floor(tempestStats?.defence) || '0')
                           : notateNumber(tempestStats?.defence || 0).replace('.00', '')}/>
      <CardTitleAndValue title={'Mastery'}
                         value={`${notateNumber(tempestStats?.mastery, 'MultiplierInfo').replace('.00', '')}%`}/>
      <CardTitleAndValue title={'Crit pct'}
                         value={`${notateNumber(tempestStats?.critPct, 'MultiplierInfo').replace('.00', '')}%`}/>
      <CardTitleAndValue title={'Crit damage'}
                         value={`${notateNumber(tempestStats?.critDamage, 'MultiplierInfo').replace('.00', '')}x`}/>
      <CardTitleAndValue title={'Attack speed'}
                         value={`${notateNumber(tempestStats?.attackSpeed, 'MultiplierInfo').replace('.00', '')}%`}/>
      <CardTitleAndValue title={'Invulnerable time'}
                         value={notateNumber(tempestStats?.invulnerableTime, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Range'}
                         value={notateNumber(tempestStats?.range, 'MultiplierInfo').replace('.00', '')}/>
      <CardTitleAndValue title={'Move speed'}
                         value={`${notateNumber(tempestStats?.moveSpeed, 'MultiplierInfo').replace('.00', '')}%`}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'compass')}>
      <Upgrades upgrades={groupedUpgrades} dusts={dusts}/>
      <UpgradeOptimizer character={state?.characters?.[selectedChar]} account={state?.account}/>
      <Abominations abominations={abominations}/>
      <Medallions medallions={medallions} totalAcquiredMedallions={totalAcquiredMedallions}/>
      <Portals maps={maps}/>
    </Tabber>
  </>;
};

export default Compass;

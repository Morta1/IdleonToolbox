import { Divider, Select, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum, getTabs, prefix } from '@utility/helpers';
import Num from '@components/common/Num';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Compass/Upgrades';
import Abominations from '@components/account/Misc/class-specific/Compass/Abominations';
import Medallions from '@components/account/Misc/class-specific/Compass/Medallions';
import Portals from '@components/account/Misc/class-specific/Compass/Portals';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Compass/UpgradeOptimizer';
import { getCompassStats, getExtraDust } from '@parsers/class-specific/compass';
import { checkCharClass, CLASSES } from '@parsers/talents';
import MenuItem from '@mui/material/MenuItem';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import useMasterclassCostControls from '@components/account/Misc/class-specific/useMasterclassCostControls';

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
  const [selectedChar, setSelectedChar] = useState(null);
  const windWalkers = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Wind_Walker));
  // Derived rather than stored: an initial index only ever matched the right character when the
  // account had exactly one wind walker, so two or more left every stat on the first character
  // in the account - who usually isn't a wind walker at all.
  const selectedWindWalker = windWalkers?.find((character) => character?.playerId === selectedChar)
    ?? windWalkers?.[0];
  const tempestStats = getCompassStats(selectedWindWalker, state?.account);
  const extraDust = getExtraDust(selectedWindWalker, state?.account);
  // Levels ahead and the Daily Shopping Spree price the Upgrades tab: in the page's gear, under the tab's name
  const { gear: costSettings, ...costing } = useMasterclassCostControls(state?.account, 'compass');

  return <>
    <NextSeo
      title="Compass | Idleon Toolbox"
      description="Keep track of your compass levels, upgrades and compass stats"
    />
    {groupedUpgrades?.length ? costSettings : null}
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {windWalkers.length > 1 ? <CardTitleAndValue title={'Character'}
                                                   value={<Select size={'small'}
                                                                  value={selectedWindWalker?.playerId ?? ''}
                                                                  onChange={(e) => setSelectedChar(e.target.value)}>
                                                     {windWalkers?.map((character, index) => {
                                                       return <MenuItem key={character?.name + index}
                                                                        value={character?.playerId}
                                                                        selected={selectedWindWalker?.playerId === character?.playerId}>
                                                         <Stack direction={'row'} alignItems={'center'} gap={2}>
                                                           <img
                                                             src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                                                             alt="" width={32} height={32}/>
                                                           <Typography>{character?.name}</Typography>
                                                         </Stack>
                                                       </MenuItem>
                                                     })}
                                                   </Select>}/> : null}
      <CardTitleAndValue title={'Total levels'} value={totalUpgradeLevels} kind={'amount'}/>
      <CardTitleAndValue title={'Extra Dust'}
                         value={<Stack direction={'row'} alignItems={'center'} gap={1}>
                           <Typography><Num value={extraDust.value} game={'Windwalker.ExtraDust'} unit={'x'}/></Typography>
                           <Breakdown data={extraDust.breakdown}>
                             <Stack justifyContent={'center'}>
                               <IconInfoCircleFilled size={18}/>
                             </Stack>
                           </Breakdown>
                         </Stack>}
                         tooltipTitle={'Not including Spirit Reindeer kills'}/>
      <CardTitleAndValue title={'Total dust collected'} value={totalDustsCollected || 0} kind={'amount'}/>
      <CardTitleAndValue title={'Exalted stamps'}
                         icon={'etc/Exalted_Stamp_Frame.png'}
                         imgStyle={{ width: 40, height: 40 }}
                         value={`${remainingExaltedStamps} / ${usedExaltedStamps + remainingExaltedStamps}`}/>
      <CardTitleAndValue title={'TOTM Kills'}
                         value={topOfTheMorninKills} kind={'amount'}/>
      {dusts?.map(({ value, name }, index) => <CardTitleAndValue key={index} value={value || 0} kind={'amount'}
                                                                 title={name}
                                                                 icon={`data/Dust${index}_x1.png`}
                                                                 imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Hp'} value={<Num value={tempestStats?.hp} game={'Windwalker.Compass_HP'}/>}/>
      <CardTitleAndValue title={'Damage'} value={<Num value={tempestStats?.damage} game={'Windwalker.Compass_DMG'}/>}/>
      <CardTitleAndValue title={'Accuracy'} value={<Num value={tempestStats?.accuracy} game={'Windwalker.Compass_ACC'}/>}/>
      <CardTitleAndValue title={'Defence'} value={<Num value={tempestStats?.defence} game={'Windwalker.Compass_DEF'}/>}/>
      <CardTitleAndValue title={'Mastery'} value={tempestStats?.mastery} kind={'pct'}/>
      <CardTitleAndValue title={'Crit pct'}
                         value={<Num value={tempestStats?.critPct} game={'Windwalker.Compass_CRITPCT'} unit={'%'}/>}/>
      <CardTitleAndValue title={'Crit damage'}
                         value={<Num value={tempestStats?.critDamage} game={'Windwalker.Compass_CRITDMG'} unit={'x'}/>}/>
      {/* The game's stat panel prints 100 plus the bonus; the parser's move speed already holds the 100. */}
      <CardTitleAndValue title={'Attack speed'}
                         value={<Num value={100 + (tempestStats?.attackSpeed ?? 0)} game={'Windwalker.Compass_AttackSpdPCT'}
                                     unit={'%'}/>}/>
      <CardTitleAndValue title={'Invulnerable time'}
                         value={formatNum(tempestStats?.invulnerableTime, 'amount', { precise: true })}/>
      <CardTitleAndValue title={'Range'} value={tempestStats?.range} kind={'amount'}/>
      <CardTitleAndValue title={'Move speed'}
                         value={<Num value={tempestStats?.moveSpeed} game={'Windwalker.Compass_MoveSpeed'} unit={'%'}/>}/>
      <CardTitleAndValue title={'Multishot'} value={tempestStats?.multiShotPct} kind={'pct'}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'compass')}>
      <Upgrades account={state?.account} upgrades={groupedUpgrades} dusts={dusts} costing={costing}/>
      <UpgradeOptimizer character={selectedWindWalker} account={state?.account}/>
      <Abominations abominations={abominations}/>
      <Medallions medallions={medallions} totalAcquiredMedallions={totalAcquiredMedallions}/>
      <Portals maps={maps}/>
    </Tabber>
  </>;
};

export default Compass;

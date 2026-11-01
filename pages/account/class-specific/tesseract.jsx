import { NextSeo } from 'next-seo';
import React, { useContext, useEffect, useState } from 'react';
import { Divider, Select, Stack, Typography } from '@mui/material';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import MenuItem from '@mui/material/MenuItem';
import { getTabs, prefix } from '@utility/helpers';
import Num from '@components/common/Num';
import { getArcanistStats, getExtraTachyon, getPrismaFragChance, getTotalTachyonsCollected } from '@parsers/class-specific/tesseract';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Tesseract/Upgrades';
import Maps from '@components/account/Misc/class-specific/Tesseract/Maps';
import { getDropRate } from '@parsers/character';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Tesseract/UpgradeOptimizer';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Tesseract = () => {
  const { state } = useContext(AppContext);
  const {
    upgrades,
    totalUpgradeLevels,
    tachyons
  } = state?.account?.tesseract || {};
  const [selectedChar, setSelectedChar] = useState(0);
  const arcanists = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Arcane_Cultist));
  const arcanistStats = getArcanistStats(upgrades, totalUpgradeLevels, state?.characters?.[selectedChar], state?.account);
  const _dropRate = getDropRate(state?.characters?.[selectedChar], state?.account, state?.characters);
  const prismaFragmentChance = getPrismaFragChance(({ ...state?.characters?.[selectedChar], dropRate: _dropRate }), state?.account, upgrades);
  const extraTachyon = getExtraTachyon(state?.characters?.[selectedChar], state?.account);
  const totalTachyonsCollected = getTotalTachyonsCollected(state?.account);

  useEffect(() => {
    if (arcanists.length === 1) {
      setSelectedChar(arcanists?.[0]?.playerId);
    }
  }, []);

  return <>
    <NextSeo
      title="Tesseract | Idleon Toolbox"
      description="Keep track of your tesseract upgrades, tachyons and arcanist stats"
    />
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {arcanists.length > 1 ? <CardTitleAndValue title={'Character'}
                                                 value={<Select size={'small'} value={selectedChar}
                                                                onChange={(e) => setSelectedChar(e.target.value)}>
                                                   {arcanists?.map((character, index) => {
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
      <CardTitleAndValue title={'Total levels'} value={totalUpgradeLevels} kind={'amount'}/>
      <CardTitleAndValue title={'Total Tachyons Collected'} value={totalTachyonsCollected} kind={'amount'}/>
      <CardTitleAndValue title={'Prisma Chance'} value={prismaFragmentChance} kind={'odds'}/>
      <CardTitleAndValue title={'Extra tachyon'}
                         value={<Stack direction={'row'} alignItems={'center'} gap={1}>
                           <Typography><Num value={extraTachyon.value} game={'ArcaneType.ExtraTachyon'} unit={'x'}/></Typography>
                           <Breakdown data={extraTachyon.breakdown}>
                             <Stack justifyContent={'center'}>
                               <IconInfoCircleFilled size={18}/>
                             </Stack>
                           </Breakdown>
                         </Stack>}
      />
      {tachyons?.map(({ value, name }, index) => <CardTitleAndValue key={index} value={value || 0} kind={'amount'}
                                                                    title={name}
                                                                    icon={`data/Tach${index}_x1.png`}
                                                                    imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ mb: 3 }}/>
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Damage'} value={<Num value={arcanistStats?.damage} game={'ArcaneType.Arcane_DMG'}/>}/>
      <CardTitleAndValue title={'Accuracy'} value={<Num value={arcanistStats?.accuracy} game={'ArcaneType.Arcane_ACC'}/>}/>
      <CardTitleAndValue title={'Defence'} value={<Num value={arcanistStats?.defence} game={'ArcaneType.Arcane_DEF'}/>}/>
      <CardTitleAndValue title={'Mastery'} value={arcanistStats?.mastery} kind={'pct'}/>
      <CardTitleAndValue title={'Crit pct'}
                         value={<Num value={arcanistStats?.critPct} game={'ArcaneType.Arcane_CRITPCT'} unit={'%'}/>}/>
      <CardTitleAndValue title={'Crit damage'}
                         value={<Num value={arcanistStats?.critDamage} game={'ArcaneType.Arcane_CRITDMG'} unit={'x'}/>}/>
      {/* The game's stat panel prints 100 plus the bonus. */}
      <CardTitleAndValue title={'Attack speed'}
                         value={<Num value={100 + (arcanistStats?.attackSpeed ?? 0)} game={'ArcaneType.Arcane_AttackSpdPCT'}
                                     unit={'%'}/>}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'tesseract')}>
      <Upgrades account={state?.account} upgrades={upgrades} tachyons={tachyons}/>
      <UpgradeOptimizer account={state?.account} character={state?.characters?.[selectedChar]} />
      <Maps account={state?.account} character={state?.characters?.[selectedChar]} characters={state?.characters}/>
    </Tabber>
  </>
};

export default Tesseract;

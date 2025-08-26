import { NextSeo } from 'next-seo';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Divider, Select, Stack, Typography } from '@mui/material';
import { checkCharClass, CLASSES } from '@parsers/talents';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';
import MenuItem from '@mui/material/MenuItem';
import { commaNotation, getTabs, notateNumber, numberWithCommas, prefix } from '@utility/helpers';
import { getArcanistStats, getExtraTachyon, getPrismaFragChance } from '@parsers/tesseract';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Misc/class-specific/Tesseract/Upgrades';
import Maps from '@components/account/Misc/class-specific/Tesseract/Maps';
import { getDropRate } from '@parsers/character';
import UpgradeOptimizer from '@components/account/Misc/class-specific/Tesseract/UpgradeOptimizer';

const Tesseract = () => {
  const { state } = useContext(AppContext);
  const {
    upgrades,
    totalUpgradeLevels,
    tachyons
  } = state?.account?.tesseract || {};
  const [selectedChar, setSelectedChar] = useState(0);
  const arcanists = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Arcane_Cultist));
  const arcanistStats = useMemo(() => getArcanistStats(upgrades, totalUpgradeLevels, state?.characters?.[selectedChar], state?.account), [selectedChar]);
  const prismaFragmentChance = useMemo(() => {
    const dropRate = getDropRate(state?.characters?.[selectedChar], state?.account, state?.characters);
    return getPrismaFragChance(({ ...state?.characters?.[selectedChar], dropRate }), state?.account, upgrades)
  }, [selectedChar]);

  useEffect(() => {
    if (arcanists.length === 1) {
      setSelectedChar(arcanists?.[0]?.playerId);
    }
  }, []);

  return <>
    <NextSeo
      title="Tesseract | Idleon Toolbox"
      description="Keep track of your compass levels, upgrades and compass stats"
    />
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
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
      <CardTitleAndValue title={'Total levels'} value={totalUpgradeLevels}/>
      <CardTitleAndValue title={'Prisma Chance'} value={`1 in ${Math.floor(1 / prismaFragmentChance)}`}/>
      <CardTitleAndValue title={'Extra tachyon'}
                         value={`${getExtraTachyon(state?.characters?.[selectedChar], state?.account).toFixed(2)}x`}
      />
      {tachyons?.map(({ value, name }, index) => <CardTitleAndValue key={index} value={value < 1e8
        ? commaNotation(value || '0') : notateNumber(value || 0)} title={name}
                                                                    icon={`data/Tach${index}_x1.png`}
                                                                    imgStyle={{ objectPosition: '0 -6px' }}
      />)}
    </Stack>
    <Divider sx={{ mt: { xs: 2, md: 0 } }}/>
    <Stack direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Damage'} value={arcanistStats?.damage < 1e8
        ? numberWithCommas(Math.floor(arcanistStats?.damage) || '0')
        : notateNumber(arcanistStats?.damage || 0)}/>
      <CardTitleAndValue title={'Accuracy'}
                         value={arcanistStats?.accuracy < 1e8
                           ? numberWithCommas(Math.floor(arcanistStats?.accuracy) || '0')
                           : notateNumber(arcanistStats?.accuracy || 0).replace('.00', '')}/>
      <CardTitleAndValue title={'Defence'}
                         value={arcanistStats?.defence < 1e8
                           ? numberWithCommas(Math.floor(arcanistStats?.defence) || '0')
                           : notateNumber(arcanistStats?.defence || 0).replace('.00', '')}/>
      <CardTitleAndValue title={'Mastery'}
                         value={`${notateNumber(arcanistStats?.mastery, 'MultiplierInfo').replace('.00', '')}%`}/>
      <CardTitleAndValue title={'Crit pct'}
                         value={`${notateNumber(arcanistStats?.critPct, 'MultiplierInfo').replace('.00', '')}%`}/>
      <CardTitleAndValue title={'Crit damage'}
                         value={`${notateNumber(arcanistStats?.critDamage, 'MultiplierInfo').replace('.00', '')}x`}/>
      <CardTitleAndValue title={'Attack speed'}
                         value={`${notateNumber(arcanistStats?.attackSpeed, 'MultiplierInfo').replace('.00', '')}%`}/>
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'tesseract')}>
      <Upgrades upgrades={upgrades} tachyons={tachyons}/>
      <UpgradeOptimizer account={state?.account} character={state?.characters?.[selectedChar]} />
      <Maps account={state?.account} character={state?.characters?.[selectedChar]}/>
    </Tabber>
  </>
};

export default Tesseract;

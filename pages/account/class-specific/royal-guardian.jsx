import { Divider, Select, Stack, Typography } from '@mui/material';
import { CardTitleAndValue } from '@components/common/styles';
import MenuItem from '@mui/material/MenuItem';
import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { getTabs, notateNumber, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Armory from '@components/account/Misc/class-specific/RoyalGuardian/Armory';
import UpgradeOptimizer from '@components/account/Misc/class-specific/RoyalGuardian/UpgradeOptimizer';
import RoyalStatues from '@components/account/Misc/class-specific/RoyalGuardian/RoyalStatues';
import OrbletMarket from '@components/account/Misc/class-specific/RoyalGuardian/OrbletMarket';
import Outposts from '@components/account/Misc/class-specific/RoyalGuardian/Outposts';
import Resources from '@components/account/Misc/class-specific/RoyalGuardian/Resources';
import { checkCharClass, CLASSES } from '@parsers/talents';

const RoyalGuardian = () => {
  const { state } = useContext(AppContext);
  const royalGuardian = state?.account?.royalGuardian;
  const { armory, royalStatues, statueFlair, orbletMarket, orblets, outpostStats, raw } = royalGuardian ?? {};
  const [selectedChar, setSelectedChar] = useState(null);
  const royalGuardians = state?.characters?.filter((character) => checkCharClass(character?.class, CLASSES.Royal_Guardian));
  // Derived rather than stored: an initial index only ever matched the right character when the
  // account had exactly one Royal Guardian, same fix as Compass's selectedWindWalker.
  const selectedRoyalGuardian = royalGuardians?.find((character) => character?.playerId === selectedChar)
    ?? royalGuardians?.[0];
  const selectedRogBonus = outpostStats?.rogBonuses?.find((bonus) => bonus?.selected);

  return <>
    <NextSeo
      title="Royal Guardian | Idleon Toolbox"
      description="Keep track of your Royal Guardian's armory, royal statues, statue flair and orblet market"
    />
    <Stack mb={3} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
      {royalGuardians.length > 1 ? <CardTitleAndValue title={'Character'}
                                                      value={<Select size={'small'} value={selectedRoyalGuardian?.playerId ?? ''}
                                                                     onChange={(e) => setSelectedChar(e.target.value)}>
                                                        {royalGuardians?.map((character, index) => {
                                                          return <MenuItem key={character?.name + index}
                                                                           value={character?.playerId}
                                                                           selected={selectedRoyalGuardian?.playerId === character?.playerId}>
                                                            <Stack direction={'row'} alignItems={'center'} gap={2}>
                                                              <img
                                                                src={`${prefix}data/ClassIcons${character?.classIndex}.png`}
                                                                alt="" width={32} height={32}/>
                                                              <Typography>{character?.name}</Typography>
                                                            </Stack>
                                                          </MenuItem>
                                                        })}
                                                      </Select>}/> : null}
      <CardTitleAndValue title={'Total Armory Levels'} value={notateNumber(armory?.totalLevels || 0)}/>
      <CardTitleAndValue title={'Shelves Unlocked'}
                         value={`${armory?.unlockedSlots ?? 0} / ${armory?.slotToId?.length ?? 0}`}/>
      <CardTitleAndValue title={'Outposts Built'} value={outpostStats?.built ?? 0}/>
      {selectedRogBonus ? <CardTitleAndValue title={selectedRogBonus?.name}
                         value={`${notateNumber(selectedRogBonus?.value, 'MultiplierInfo')}x`}/> : null}
    </Stack>
    <Divider sx={{ mb: 3, mt: { xs: 2, md: 0 } }}/>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['class-specific'].categories, 'royalGuardian')}>
      <Armory upgrades={armory?.upgrades} resourceStorage={raw?.[1]}/>
      <Outposts outposts={royalGuardian?.outposts} outpostStats={outpostStats}
               resources={royalGuardian?.resources}/>
      <Resources resources={royalGuardian?.resources} outposts={royalGuardian?.outposts}/>
      <UpgradeOptimizer account={state?.account} character={selectedRoyalGuardian}/>
      <RoyalStatues royalStatues={royalStatues} statueFlair={statueFlair}/>
      <OrbletMarket orbletMarket={orbletMarket} orblets={orblets}/>
    </Tabber>
  </>;
};

export default RoyalGuardian;

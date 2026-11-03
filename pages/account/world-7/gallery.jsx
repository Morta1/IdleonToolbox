import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, MenuItem, TextField } from '@mui/material';
import { cleanUnderscore, formatNum, getTabs } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Trophies from '@components/account/Worlds/World7/Gallery/Trophies';
import Nametags from '@components/account/Worlds/World7/Gallery/Nametags';
import {
  getGalleryBonusMulti,
  getTrophyBonuses,
  getNametagBonuses,
  getAllTrophies,
  getAllNametags
} from '@parsers/world-7/gallery';

// A bonus the game names with a leading "%" is a percent, as its item line prints it ("+12.5%_DROP_RATE"); the rest
// (STR, Weapon Power) are flat amounts. A percent keeps the game's "% LUK" name, so it never shares a label with the
// flat LUK beside it.
const bonusRows = (bonuses) => (bonuses ?? []).map(({ name, value }) => {
  const percent = String(name ?? '').startsWith('%');
  const label = cleanUnderscore(String(name ?? ''));
  return [label, percent
    ? formatNum(value ?? 0, 'pct', { signed: true })
    : formatNum(value ?? 0, 'amount', { signed: true })];
});

const Gallery = () => {
  const { state } = useContext(AppContext);
  const [pickedId, setPickedId] = useState('');
  const account = state?.account;
  const section = account?.gallery;
  const sectionFailed = isSectionFailed(account, 'gallery');
  const character = pickedId ? state?.characters?.find((char) => char?.playerId === pickedId) : null;
  const { rawSpelunk, podiumsOwned, lv2PodiumsOwned, lv3PodiumsOwned, lv4PodiumsOwned } = section ?? {};

  // The gallery as one character sees it (a map cleared turns its bonus on), only from a section that parsed
  const perCharacter = Boolean(character && rawSpelunk) && !sectionFailed;
  const charTrophyData = perCharacter ? getTrophyBonuses(rawSpelunk, account, character) : null;
  const charNametagData = perCharacter ? getNametagBonuses(rawSpelunk, account, character) : null;
  const galleryData = perCharacter
    ? {
      bonusMulti: getGalleryBonusMulti(rawSpelunk, account, character),
      trophyBonuses: charTrophyData?.bonuses,
      nametagBonuses: charNametagData?.bonuses,
      trophiesUsed: charTrophyData?.items,
      nametagsUsed: charNametagData?.items,
      inventoryTrophies: charTrophyData?.inventory,
      allTrophies: getAllTrophies(rawSpelunk, account, character),
      allNametags: getAllNametags(rawSpelunk, account, character)
    }
    : section ?? {};
  const {
    bonusMulti,
    trophyBonuses,
    nametagBonuses,
    trophiesUsed,
    nametagsUsed,
    inventoryTrophies,
    allTrophies,
    allNametags
  } = galleryData;

  return <>
    <NextSeo
      title="Gallery | Idleon Toolbox"
      description="Keep track of your gallery bonuses, podiums, and trophies"
    />
    {state?.characters?.length ? <PageHeaderControl>
      <TextField select value={pickedId} onChange={(event) => setPickedId(event.target.value)} sx={{ minWidth: 200 }}
                 slotProps={{
                   select: {
                     displayEmpty: true,
                     renderValue: (id) => <><Box component={'span'} sx={{ color: 'text.secondary', mr: 0.75 }}>Bonuses for</Box>
                       {id ? state?.characters?.find((char) => char?.playerId === id)?.name : 'Account'}</>,
                     SelectDisplayProps: { 'aria-label': 'Bonuses for' }
                   }
                 }}>
        <MenuItem value={''}>Account</MenuItem>
        {state?.characters?.map((char) => <MenuItem key={char?.playerId} value={char?.playerId}>{char?.name}</MenuItem>)}
      </TextField>
    </PageHeaderControl> : null}
    {!section || sectionFailed ? <MissingData name={'Gallery'} failed={sectionFailed}/> : null}
    <PageSummary>
      <StatTile label={'Podiums'} value={podiumsOwned ?? 0} kind={'amount'}/>
      <StatTile label={'Bonus multi'} value={<Num value={bonusMulti ?? 1} game={'Gallery.GalleryBonusMulti'} unit={'x'}/>}/>
      <StatTile label={'Level 2 podiums'} icon={'data/GalleryPod1.png'} value={lv2PodiumsOwned ?? 0} kind={'amount'}/>
      <StatTile label={'Level 3 podiums'} icon={'data/GalleryPod2.png'} value={lv3PodiumsOwned ?? 0} kind={'amount'}/>
      <StatTile label={'Level 4 podiums'} icon={'data/GalleryPod3.png'} value={lv4PodiumsOwned ?? 0} kind={'amount'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'Gallery')}>
      <Trophies
        trophiesUsed={trophiesUsed}
        bonusRows={bonusRows(trophyBonuses)}
        inventoryTrophies={inventoryTrophies}
        allTrophies={allTrophies}
      />
      <Nametags
        nametagsUsed={nametagsUsed}
        bonusRows={bonusRows(nametagBonuses)}
        allNametags={allNametags}
      />
    </Tabber>
  </>;
};

export default Gallery;

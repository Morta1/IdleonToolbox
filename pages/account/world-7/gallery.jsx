import React, { useContext, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Select, Stack, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import { notateNumber, getTabs, prefix } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
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

const Gallery = () => {
  const { state } = useContext(AppContext);
  const [selectedChar, setSelectedChar] = useState(null);

  if (!state?.account?.gallery) return <MissingData name={'gallery'} />;

  const {
    rawSpelunk,
    podiumsOwned,
    lv2PodiumsOwned,
    lv3PodiumsOwned,
    lv4PodiumsOwned
  } = state.account.gallery;

  const character = selectedChar !== null
    ? state?.characters?.find(c => c.playerId === selectedChar)
    : null;

  // Recalculate gallery data per character when selected
  const isPerCharacter = character && rawSpelunk;
  const charTrophyData = isPerCharacter ? getTrophyBonuses(rawSpelunk, state.account, character) : null;
  const charNametagData = isPerCharacter ? getNametagBonuses(rawSpelunk, state.account, character) : null;

  const galleryData = isPerCharacter
    ? {
        bonusMulti: getGalleryBonusMulti(rawSpelunk, state.account, character),
        trophyBonuses: charTrophyData.bonuses,
        nametagBonuses: charNametagData.bonuses,
        trophiesUsed: charTrophyData.items,
        nametagsUsed: charNametagData.items,
        inventoryTrophies: charTrophyData.inventory,
        allTrophies: getAllTrophies(rawSpelunk, state.account, character),
        allNametags: getAllNametags(rawSpelunk, state.account, character),
      }
    : state.account.gallery;

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

  const formatBonuses = (bonuses) => {
    const leftColumn = [];
    const rightColumn = [];

    bonuses.forEach(({ name, value }, index) => {
      const formattedValue = notateNumber(value, 'MultiplierInfo');

      const bonusName = name.replace(/_/g, ' ');
      const isPercentage = bonusName && (
        bonusName.toLowerCase().includes('multi') ||
        bonusName.toLowerCase().includes('chance') ||
        bonusName.toLowerCase().includes('gain') ||
        bonusName.toLowerCase().includes('exp') ||
        bonusName.toLowerCase().includes('money')
      );

      const displayValue = isPercentage ? `${formattedValue}%` : formattedValue;

      const bonusText = `+${displayValue} ${bonusName}`;

      if (index % 2 === 0) {
        leftColumn.push({ bonusText, key: `bonus-${index}` });
      } else {
        rightColumn.push({ bonusText, key: `bonus-${index}` });
      }
    });

    return { leftColumn, rightColumn };
  };

  const formattedTrophyBonuses = formatBonuses(trophyBonuses || []);
  const formattedNametagBonuses = formatBonuses(nametagBonuses || []);

  return <>
    <NextSeo
      title="Gallery | Idleon Toolbox"
      description="Keep track of your gallery bonuses, podiums, and trophies"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'Total Podiums'} value={podiumsOwned || 0} />
      <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`} />
      <CardTitleAndValue title={'Level 2 Podiums'} value={lv2PodiumsOwned || '0'} icon={'data/GalleryPod1.png'} imgStyle={{ width: 24, heigth: 24 }} />
      <CardTitleAndValue title={'Level 3 Podiums'} value={lv3PodiumsOwned || '0'} icon={'data/GalleryPod2.png'} imgStyle={{ width: 24, heigth: 24 }} />
      <CardTitleAndValue title={'Level 4 Podiums'} value={lv4PodiumsOwned || '0'} icon={'data/GalleryPod3.png'} imgStyle={{ width: 24, heigth: 24 }} />
      {state?.characters?.length > 0 && <CardTitleAndValue title={'Character'}
        value={<Select size={'small'} value={selectedChar ?? ''}
          displayEmpty
          onChange={(e) => setSelectedChar(e.target.value === '' ? null : e.target.value)}>
          <MenuItem value={''}>
            <Typography>Account</Typography>
          </MenuItem>
          {state?.characters?.map((char, index) => {
            return <MenuItem key={char?.name + index}
              value={char?.playerId}>
              <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img
                  src={`${prefix}data/ClassIcons${char?.classIndex}.png`}
                  alt="" width={32} height={32}/>
                <Typography>{char?.name}</Typography>
              </Stack>
            </MenuItem>
          })}
        </Select>}/>}
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'Gallery')}>
      <Trophies
        trophiesUsed={trophiesUsed}
        trophyBonuses={trophyBonuses}
        formattedTrophyBonuses={formattedTrophyBonuses}
        inventoryTrophies={inventoryTrophies}
        allTrophies={allTrophies}
      />
      <Nametags
        nametagsUsed={nametagsUsed}
        nametagBonuses={nametagBonuses}
        formattedNametagBonuses={formattedNametagBonuses}
        allNametags={allNametags}
      />
    </Tabber>
  </>;
};

export default Gallery;

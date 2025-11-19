import React, { useContext, useMemo } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Stack } from '@mui/material';
import { notateNumber } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, MissingData } from '@components/common/styles';
import Tabber from '@components/common/Tabber';
import { getTabs } from '@utility/helpers';
import { PAGES } from '@components/constants';
import Trophies from '@components/account/Worlds/World7/Gallery/Trophies';
import Nametags from '@components/account/Worlds/World7/Gallery/Nametags';

const Gallery = () => {
  const { state } = useContext(AppContext);
  const {
    bonusMulti,
    trophyBonuses,
    nametagBonuses,
    podiumsOwned,
    lv2PodiumsOwned,
    lv3PodiumsOwned,
    lv4PodiumsOwned,
    trophiesUsed,
    nametagsUsed
  } = state?.account?.gallery || {};

  if (!state?.account?.gallery) return <MissingData name={'gallery'} />;

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

  const formattedTrophyBonuses = useMemo(() => formatBonuses(trophyBonuses || []), [trophyBonuses]);
  const formattedNametagBonuses = useMemo(() => formatBonuses(nametagBonuses || []), [nametagBonuses]);

  return <>
    <NextSeo
      title="Gallery | Idleon Toolbox"
      description="Keep track of your gallery bonuses, podiums, and trophies"
    />

    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Total Podiums'} value={podiumsOwned || 0} />
      <CardTitleAndValue title={'Bonus Multiplier'} value={`${notateNumber(bonusMulti, 'MultiplierInfo')}x`} />
      <CardTitleAndValue title={'Level 2 Podiums'} value={lv2PodiumsOwned || '0'} icon={'data/GalleryPod1.png'} imgStyle={{ width: 24, heigth: 24 }} />
      <CardTitleAndValue title={'Level 3 Podiums'} value={lv3PodiumsOwned || '0'} icon={'data/GalleryPod2.png'} imgStyle={{ width: 24, heigth: 24 }} />
      <CardTitleAndValue title={'Level 4 Podiums'} value={lv4PodiumsOwned || '0'} icon={'data/GalleryPod3.png'} imgStyle={{ width: 24, heigth: 24 }} />
    </Stack>

    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'Gallery')}>
      <Trophies 
        trophiesUsed={trophiesUsed}
        trophyBonuses={trophyBonuses}
        formattedTrophyBonuses={formattedTrophyBonuses}
      />
      <Nametags 
        nametagsUsed={nametagsUsed}
        nametagBonuses={nametagBonuses}
        formattedNametagBonuses={formattedNametagBonuses}
      />
    </Tabber>
  </>;
};

export default Gallery;


import React from 'react';
import { formatNum } from '@utility/helpers';
import BonusesPanel from '@components/account/BonusesPanel';
import { CatalogList } from '@components/account/Worlds/World7/Gallery/Trophies';

const nametagMeta = (nametag) => (nametag?.isAcquired
  ? `Lv ${formatNum(nametag?.level ?? 0)} · ${formatNum(nametag?.nametagMultiplier, 'mult')}`
  : null);

// The nametags are worn, not placed: their bonuses, then the catalog alone
const Nametags = ({ bonusRows, allNametags, sectionFailed }) => <>
  <BonusesPanel rows={bonusRows} sx={{ my: 3 }}/>
  <CatalogList page={'gallery-nametags'} title={'All nametags'} noun={'nametags'} items={allNametags} meta={nametagMeta}
               tileValue={(nametag) => `Lv ${formatNum(nametag?.level ?? 0)}`} failed={sectionFailed}/>
</>;

export default Nametags;

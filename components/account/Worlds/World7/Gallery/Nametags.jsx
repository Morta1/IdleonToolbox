import React from 'react';
import { formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import { CatalogList } from '@components/account/Worlds/World7/Gallery/Trophies';

const nametagMeta = (nametag) => (nametag?.isAcquired
  ? `Lv ${formatNum(nametag?.level ?? 0)} · ${formatNum(nametag?.nametagMultiplier, 'mult')}`
  : null);

// The nametags are worn, not placed: their bonuses, then the catalog alone
const Nametags = ({ bonusRows, allNametags, sectionFailed }) => <>
  {/* A guest has no bonus: no Panel, no heading */}
  {bonusRows?.length ? <Panel title={'Bonuses'} sx={{ my: 3 }}>
    {bonusRows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
  </Panel> : null}
  <CatalogList page={'gallery-nametags'} title={'All nametags'} noun={'nametags'} items={allNametags} meta={nametagMeta} failed={sectionFailed}/>
</>;

export default Nametags;

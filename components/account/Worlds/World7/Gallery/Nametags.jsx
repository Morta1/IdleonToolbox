import React from 'react';
import { Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import CardGrid from '@components/common/cards/CardGrid';
import Panel from '@components/common/cards/Panel';
import { catalogCard } from '@components/account/Worlds/World7/Gallery/Trophies';

const nametagMeta = (nametag) => (nametag?.isAcquired
  ? `Lv ${formatNum(nametag?.level ?? 0)} · ${formatNum(nametag?.nametagMultiplier, 'mult')}`
  : 'Not acquired');

// The nametags are worn, not placed: the catalog alone, then their bonuses
const Nametags = ({ bonusRows, allNametags }) => <>
  {allNametags?.length ? <Stack gap={1} sx={{ my: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>All nametags</Typography>
    <CardGrid size={'s'}>{allNametags.map((nametag) => catalogCard(nametag, nametagMeta(nametag)))}</CardGrid>
  </Stack> : null}
  {/* A guest has no bonus: no Panel, no heading */}
  {bonusRows?.length ? <Panel title={'Bonuses'} sx={{ my: 3 }}>
    {bonusRows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
  </Panel> : null}
</>;

export default Nametags;

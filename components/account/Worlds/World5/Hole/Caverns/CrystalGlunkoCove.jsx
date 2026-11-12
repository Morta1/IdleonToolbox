import React from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import StatTile from '@components/common/cards/StatTile';
import IconTile from '@components/common/cards/IconTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import Num from '@components/common/Num';
import { opalsFoundTile } from '@components/account/Worlds/World5/Hole/commons';

const upgradeCard = (upgrade) => <ItemCard key={upgrade.index} title={cleanUnderscore(upgrade.name)}
                                           level={{ value: upgrade.level ?? 0 }}
                                           status={upgrade.unlocked ? undefined : 'locked'}
                                           dimmed={upgrade.unlocked && !(upgrade.level > 0)}
                                           footer={upgrade.unlocked
                                             ? <ItemCard.Cost icon={`data/${upgrade.shapeName}.png`}
                                                              iconAlt={cleanUnderscore(upgrade.requirement)}
                                                              need={upgrade.cost ?? 0} have={upgrade.shapeOwned ?? 0}
                                                              game={'Holes.Cglunko_upgCost'}/>
                                             : <Typography variant={'body2'} color={'text.secondary'} component={'div'}
                                                           sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                               Find a <GameIcon src={`data/${upgrade.shapeName}.png`} size={16} alt={''}/>
                                               {cleanUnderscore(upgrade.requirement)} to unlock
                                             </Typography>}>
  <ItemCard.Desc text={upgrade.description}/>
</ItemCard>;

const upgradeSection = (title, upgrades) => (upgrades.length ? <Stack gap={1} sx={{ mt: 3 }}>
  <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
  <CardGrid size={'s'}>{upgrades.map(upgradeCard)}</CardGrid>
</Stack> : null);

const CrystalGlunkoCove = ({ hole }) => {
  const cove = hole?.caverns?.crystalGlunkoCove;
  const upgrades = cove?.upgrades ?? [];
  const shapes = cove?.shapes ?? [];
  const dropRateBreakdown = cove?.dropRateBreakdown;
  // A shape's name is the upgrade that is paid in it (each upgrade's requirement is its shape's item name)
  const shapeName = (shape) => cleanUnderscore(upgrades.find((upgrade) => upgrade?.shapeId === shape?.index)?.requirement)
    || `Shape ${(shape?.index ?? 0) + 1}`;

  return <>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'} mb={3}>
      <StatTile label={'Cove drop rate'} value={cove?.dropRate ?? 1} kind={'mult'}
                breakdown={dropRateBreakdown ? { ...dropRateBreakdown, totalValue: formatNum(cove?.dropRate ?? 1, 'mult') } : undefined}/>
      <StatTile label={'Cove AFK gains'} value={100 * (cove?.afkRate ?? 0)} kind={'pct'}/>
      <StatTile label={'Multikill per tier'} value={cove?.multiKillTier ?? 0} kind={'pct'}/>
      <StatTile label={'Base multikill'} value={cove?.multiKillBase ?? 0} kind={'pct'}/>
      <StatTile label={'Faster respawn'} value={cove?.respawn ?? 0} kind={'pct'}/>
      {/* Past 100% the whole part is a sure extra pickup and the rest the chance of one more */}
      <StatTile label={'Double pickup chance'} value={100 * (cove?.doublePickup ?? 0)} kind={'pct'}
                sub={`Average ${formatNum(1 + (cove?.doublePickup ?? 0), 'mult')} shapes per pickup`}/>
      {opalsFoundTile(hole, 17)}
    </Stack>
    {shapes.length ? <Stack gap={1}>
      <Typography variant={'sectionTitle'} component={'h2'}>Gooey shapes</Typography>
      <CardGrid size={'icon'}>
        {shapes.map((shape) => {
          // Whole shapes, as the Jars' rupies: the tile, its note and its owned state read one number (0.1 is none)
          const owned = Math.floor(Number(shape.owned) || 0);
          return <IconTile key={shape.name} icon={`data/${shape.name}.png`} alt={shapeName(shape)}
                           value={<Num value={owned} game={'Big'} whole/>} status={owned > 0 ? undefined : 'missing'}
                           details={`${shapeName(shape)}: ${formatNum(owned, 'exact')}`}/>;
        })}
      </CardGrid>
    </Stack> : null}
    {upgradeSection('Crystal upgrades', upgrades.filter((upgrade) => upgrade.group === 'crystal'))}
    {upgradeSection('Jeweled upgrades', upgrades.filter((upgrade) => upgrade.group === 'jeweled'))}
  </>;
};

export default CrystalGlunkoCove;

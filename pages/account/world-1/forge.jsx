import { AppContext } from '../../../components/common/context/AppProvider';
import React, { useContext } from 'react';
import { Box } from '@mui/material';
import { cleanUnderscore, formatNum, getCoinsArray, getTabs } from '@utility/helpers';
import CoinDisplay from '../../../components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Timer from '../../../components/common/Timer';
import { PAGES } from '@components/constants';
import { getForge } from '@parsers/world-1/forge';
import { MissingData, isSectionFailed } from '@components/common/styles';
import StatTile from '@components/common/cards/StatTile';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const getCost = (level, costMulti) => {
  if (!costMulti) {
    // this is forge slots, has it's own math.
    return Math.round(200 * Math.pow(5.4, Math.pow(level, 0.83)));
  }
  if (level < 5) {
    return Math.round(50 * Math.pow(2.5, Math.pow(level, 0.51)));
  }
  return Math.round(400 * Math.pow(costMulti, level - 5))
}

// What the levels from a level to the max cost; the total counts from Lv 0, so a maxed upgrade's total is a new
// one's cost to max
const getCostToMax = (level, maxLevel, costMulti, totalCost) => {
  let costToMax = 0;
  for (let i = totalCost ? 0 : level; i < maxLevel; i++) {
    costToMax += getCost(i, costMulti);
  }
  return costToMax ?? 0;
}

const isBlank = (material) => !material?.rawName || material.rawName === 'Blank';

// An ore, a barrel or the bars: the sprite named by the material and its quantity, nothing for a blank
const materialCell = (material) => isBlank(material) ? null
  : <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
    <GameIcon src={`data/${material.rawName}.png`} size={24}
              alt={cleanUnderscore(material?.name ?? material.rawName)}/>
    {formatNum(material?.quantity ?? 0)}
  </Box>;

const Forge = () => {
  const { state } = useContext(AppContext);
  const forgeFailed = isSectionFailed(state?.account, 'forge');
  const forge = state?.account?.forge ?? {};
  // A failed section's slots are unknown (every one "Empty" would be false): no table. The upgrades list at zero by
  // name, through the parser's catalog with no save, with no cost or Maxed.
  const slots = forgeFailed ? [] : (forge?.list ?? []).map((slot, index) => ({
    ...slot,
    index,
    empty: [slot?.ore, slot?.barrel, slot?.bar].every(isBlank)
  }));
  const upgrades = forgeFailed ? getForge({}, {})?.upgrades ?? [] : forge?.upgrades ?? [];
  const capText = forgeFailed ? '-' : formatNum(forge?.oreCapacity?.value ?? 0);
  const capBreakdown = forgeFailed ? undefined : forge?.oreCapacity?.breakdown;

  const slotColumns = [
    {
      key: 'slot',
      label: 'Slot',
      value: (row) => `Slot ${row.index + 1}${row.isBrimestone ? ' · Brimstone' : ''}`
    },
    { key: 'ore', label: 'Ore', render: (row) => materialCell(row.ore) },
    { key: 'barrel', label: 'Barrel', render: (row) => materialCell(row.barrel) },
    { key: 'bar', label: 'Bars', render: (row) => materialCell(row.bar) },
    {
      key: 'empty',
      label: 'Empty in',
      numeric: true,
      // No ore left to smelt (bars waiting, or less ore than one bar takes) has no time: a countdown from zero would
      // count the time since the save in red
      render: (row) => row.empty || !(row.ore?.timeTillEmpty > 0) ? null
        : <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                 date={new Date().getTime() + row.ore.timeTillEmpty}/>
    }
  ];

  const upgradeCard = ({ name, level = 0, maxLevel, description, costMulti }, index) => {
    const maxed = !forgeFailed && level >= maxLevel;
    const footer = forgeFailed || maxed ? null : <ItemCard.Facts rows={[
      ['Next cost', <CoinDisplay key={'next'} dense money={getCoinsArray(getCost(level, costMulti))}/>],
      ['Cost to max', <CoinDisplay key={'max'} dense money={getCoinsArray(getCostToMax(level, maxLevel, costMulti))}/>]
    ]}/>;
    return <ItemCard key={name ?? index} title={name} level={{ value: level, max: maxLevel }}
                     status={maxed ? 'maxed' : undefined} footer={footer}>
      <ItemCard.Desc text={description?.capitalize?.() ?? description}/>
      {maxed ? <ItemCard.Facts rows={[
        ['Total cost', <CoinDisplay key={'total'} dense
                                    money={getCoinsArray(getCostToMax(level, maxLevel, costMulti, true))}/>]
      ]}/> : null}
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Forge | Idleon Toolbox"
      description="Monitor your forge ore production, upgrade levels, and crafting progress in Legends of Idleon"
    />
    {forgeFailed ? <MissingData name={'Forge'} failed/> : null}
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 1'].categories, 'forge')}>
      <>
        <StatTile label={'Max ore capacity'} value={capText} cardSx={{ mb: 2 }}
                  breakdown={capBreakdown ? { ...capBreakdown, totalValue: capText } : undefined}/>
        {slots.length ? <DataTable columns={slotColumns} rows={slots} rowKey={'index'}
                                   rowLabel={(row) => `Slot ${row.index + 1}`}
                                   muted={(row) => row.empty ? 'Empty' : false}/> : null}
      </>
      <CardGrid size={'m'}>
        {upgrades.map(upgradeCard)}
      </CardGrid>
    </Tabber>
  </>
};

export default Forge;

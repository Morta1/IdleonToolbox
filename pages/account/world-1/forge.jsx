import { AppContext } from '../../../components/common/context/AppProvider';
import React, { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getCoinsArray, getTabs } from '@utility/helpers';
import CoinDisplay from '../../../components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import Tabber from '../../../components/common/Tabber';
import Timer from '../../../components/common/Timer';
import { PAGES } from '@components/constants';
import { getForge } from '@parsers/world-1/forge';
import { fedBy, MissingData, MissingSections, isSectionFailed } from '@components/common/styles';
import StatTile from '@components/common/cards/StatTile';
import PageSummary from '@components/common/cards/PageSummary';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import { Duration } from '@components/common/Num';
import usePageTop from '@hooks/usePageTop';
import useTabIndex from '@hooks/useTabIndex';

const isBlank = (material) => !material?.rawName || material.rawName === 'Blank';

const MATERIAL_SX = { display: 'inline-flex', alignItems: 'center', gap: 1, verticalAlign: 'middle', whiteSpace: 'nowrap' };
const muted = (text) => <Typography component={'div'} variant={'caption'} color={'text.secondary'} sx={{ whiteSpace: 'nowrap' }}>
  {text}
</Typography>;

// An ore, a barrel or the bars: the sprite named by the material and its quantity, nothing for a blank
const materialCell = (material, note) => isBlank(material) ? null : <Box component={'span'} sx={{ display: 'inline-block' }}>
  <Box component={'span'} sx={MATERIAL_SX}>
    <GameIcon src={`data/${material.rawName}.png`} size={24} alt={cleanUnderscore(material?.name ?? material.rawName)}/>
    {formatNum(material?.quantity ?? 0, 'whole')}
  </Box>
  {note ? muted(note) : null}
</Box>;

const BARREL_EFFECT = {
  SpeedForge: (bonus) => `+${bonus}% speed`,
  DoubleBarsForge: (bonus) => `+${bonus}% bars`
};

// What the ore capacity reads besides the forge's own upgrade (getForgeOreCapacity), by the name the note gives each
const CAPACITY_SECTIONS = {
  hole: 'the Hole', arcade: 'the Arcade', cards: 'Cards', stamps: 'Stamps', bribes: 'Bribes', upgradeVault: 'the Upgrade Vault',
  achievements: 'Achievements', rift: 'the Rift'
};

// ForgeEtcDetails("CardChance", slot): the odds a collect rolls against, by the slot's row
const CARD_NOTE = 'Collecting more than 3 bars from a slot rolls for a card. Slots 1-4 roll 1 in 100, slots 5-8 1 in 400 and '
  + 'slots 9-16 1 in 100,000, made better by this bonus and by how many bars you collect.';
const REFILL_NOTE = 'Your refill from storage is on: a slot that runs out reloads its ore and barrel from storage, so this '
  + 'counts the ore in storage too, shared by the slots smelting it.';

const coins = (amount) => <CoinDisplay dense money={getCoinsArray(amount)}/>;

const Forge = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['world 1'].categories, 'forge');
  const [tabIndex] = useTabIndex(tabs);
  const pageTop = usePageTop();
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
  const stats = forge?.stats;
  const capFailed = fedBy(state?.account, 'forge', ...Object.keys(CAPACITY_SECTIONS));
  const capText = capFailed ? '-' : formatNum(forge?.oreCapacity?.value ?? 0, 'whole');
  const capBreakdown = capFailed ? undefined : forge?.oreCapacity?.breakdown;
  const speedText = `${formatNum(stats?.speed?.value ?? 0, 'whole')}%`;

  const slotColumns = [
    {
      key: 'slot',
      label: 'Slot',
      value: (row) => `Slot ${row.index + 1}${row.isBrimestone ? ' · Brimstone' : ''}`
    },
    {
      key: 'ore', label: 'Ore',
      render: (row) => materialCell(row.ore, row.ore?.inStorage > 0 ? `${formatNum(row.ore.inStorage, 'whole')} in storage` : null)
    },
    {
      key: 'barrel', label: 'Barrel',
      render: (row) => {
        const { effect, bonus, timeTillEmpty } = row.barrel ?? {};
        const note = [effect ? BARREL_EFFECT[effect](bonus) : null, timeTillEmpty > 0 ? <>Lasts <Duration seconds={timeTillEmpty / 1000}/></> : null]
          .filter(Boolean);
        return materialCell(row.barrel, note.length ? <>{note[0]}{note[1] ? <> · {note[1]}</> : null}</> : null);
      }
    },
    { key: 'bar', label: 'Bars', render: (row) => materialCell(row.bar) },
    {
      key: 'barsPerHour',
      label: 'Bars / hr',
      numeric: true,
      value: (row) => row.barsPerHour > 0 ? formatNum(row.barsPerHour) : null
    },
    {
      key: 'empty',
      label: 'Empty in',
      numeric: true,
      info: forge?.refillOn ? REFILL_NOTE : undefined,
      // No ore left to smelt (bars waiting, or less ore than one bar takes) has no time: a countdown from zero would
      // count the time since the save in red
      render: (row) => row.empty || !(row.ore?.timeTillEmpty > 0) ? null
        : <Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                 date={new Date().getTime() + row.ore.timeTillEmpty} placeholder={'Empty'}/>
    }
  ];

  const upgradeCard = ({ name, level = 0, maxLevel, description, bonus, nextCost, costToMax, totalCost }, index) => {
    const maxed = !forgeFailed && level >= maxLevel;
    const now = forgeFailed ? [] : [['Now', bonus]];
    const footer = forgeFailed || maxed ? null : <ItemCard.Facts rows={[
      ...now,
      ['Next cost', coins(nextCost)],
      ['Cost to max', coins(costToMax)]
    ]}/>;
    return <ItemCard key={name ?? index} title={name} level={{ value: level, max: maxLevel }}
                     status={maxed ? 'maxed' : undefined} footer={footer}>
      <ItemCard.Desc text={description?.capitalize?.() ?? description}/>
      {maxed ? <ItemCard.Facts rows={[...now, ['Total cost', coins(totalCost)]]}/> : null}
    </ItemCard>;
  };

  return <>
    <NextSeo
      title="Forge | Idleon Toolbox"
      description="Monitor your forge ore production, upgrade levels, and crafting progress in Legends of Idleon"
    />
    {forgeFailed ? <MissingData name={'Forge'} failed atZero={tabs[tabIndex] === 'Upgrades'}/>
      : <MissingSections account={state?.account} names={CAPACITY_SECTIONS}/>}
    {stats ? <PageSummary failed={forgeFailed}>
      <StatTile label={'Slots'} value={`${stats.slots} / ${stats.maxSlots}`}/>
      <StatTile label={'Max ore capacity'} value={capText}
                breakdown={capBreakdown ? { ...capBreakdown, totalValue: capText } : undefined}/>
      <StatTile label={'Forge speed'} value={speedText}
                breakdown={stats.speed?.breakdown ? { ...stats.speed.breakdown, totalValue: speedText } : undefined}/>
      <StatTile label={'Forge EXP gain'} value={`+${formatNum(stats.expGain, 'whole')}%`}/>
      <StatTile label={'Multi bar chance'} value={`${formatNum(stats.multiBarChance, 'whole')}%`}/>
      <StatTile label={'Card drop chance'} value={`+${formatNum(stats.cardChance, 'whole')}%`} info={CARD_NOTE}/>
    </PageSummary> : null}
    <Tabber tabs={tabs}>
      <>
        {/* As wide as its columns from lg, the design system's rule (Refinery's salts), not stretched to the page (#23) */}
        {slots.length ? <Box sx={{ width: { xs: '100%', lg: 'fit-content' }, maxWidth: '100%' }}>
          <DataTable columns={slotColumns} rows={slots} rowKey={'index'}
                     rowLabel={(row) => `Slot ${row.index + 1}`} stickyTop={pageTop}
                     mutedWord={(row) => (row.locked ? 'Locked' : row.empty ? 'Empty' : null)}/>
        </Box> : null}
      </>
      <>
        {!forgeFailed && forge?.costToMaxAll > 0 ? <StatTile label={'Cost to max all'} value={coins(forge.costToMaxAll)} sx={{ mb: 2 }}/> : null}
        <CardGrid size={'m'}>
          {upgrades.map(upgradeCard)}
        </CardGrid>
      </>
    </Tabber>
  </>
};

export default Forge;

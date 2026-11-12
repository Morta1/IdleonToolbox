import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, growth, titleCaseName } from 'utility/helpers';
import { formatGame, gameBonusText } from '@utility/gameNotation';
import {
  LIQUID_INFO,
  MAX_VIAL_LEVEL,
  calcVialsLevels,
  getAlchemy,
  getVialMultiplier,
  vialCostsArray
} from '@parsers/world-2/alchemy';
import { NextSeo } from 'next-seo';
import { createBreakdown, info, listGroup } from '@parsers/breakdown';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import VialArt from '@components/common/VialArt';
import Toolbar from '@components/common/Toolbar';
import DataTable from '@components/common/DataTable';
import useToolbarState from '@hooks/useToolbarState';

const VIALS_TOOLBAR = { hideMaxed: false, search: '', view: 'tiles' };
// The bottle needs more room than a 72 px tile: a fill grid with a higher floor keeps 4 across at 384.
const VIAL_TILE_HEIGHT = 88;
const VIAL_GRID_SX = { gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' };

// The sections the page reads, in the order the note names the first that failed: the vials, and what the vial bonus
// reads besides them (My First Chemistry Set, the Upgrade Vault, the meritocracy bonus and Vial Mastery)
const SECTION_NAMES = {
  alchemy: 'Vials', lab: 'the Lab', upgradeVault: 'the Upgrade Vault', voteBallot: 'the Vote Ballot', rift: 'the Rift'
};

// The page's one name style for a vial ("Copper Corona")
const vialName = (vial) => titleCaseName(cleanUnderscore(vial?.name ?? ''));

// Every vial's next level costs the same: vialCostsArray[level] of its material (CustomLists.AlchemyVialQTYreq) and
// 3 x level of its liquid (CauldronStats.VialCosts). Lv 0 is a roll, not a cost, and Lv 13 is the max.
const COST_LEVELS = Array.from({ length: MAX_VIAL_LEVEL - 1 }, (_, index) => index + 1);
const costAmount = (value) => formatGame(value, 'Big', { whole: true });
const costText = (level) => `${costAmount(vialCostsArray[level])} material + ${formatNum(3 * level)} liquid`;
const COST_RANGE = `${costAmount(vialCostsArray[1])} to ${costAmount(vialCostsArray[MAX_VIAL_LEVEL - 1])}`;
// Lv 1 to the max: what a newly found vial takes to max
const TOTAL_MATERIAL = COST_LEVELS.reduce((sum, level) => sum + vialCostsArray[level], 0);
const TOTAL_LIQUID = COST_LEVELS.reduce((sum, level) => sum + 3 * level, 0);
const COST_BREAKDOWN = createBreakdown('Material per level', COST_RANGE, [
  listGroup('Next level', COST_LEVELS.map((level) => info(`Lv ${level} → ${level + 1}`, vialCostsArray[level],
    { formatted: costText(level) }))),
  info(`Lv 1 → ${MAX_VIAL_LEVEL} total`, TOTAL_MATERIAL,
    { formatted: `${costAmount(TOTAL_MATERIAL)} material + ${formatNum(TOTAL_LIQUID)} liquid` })
], { combine: 'list' });

const isMaterial = (item) => Boolean(item?.name) && item.name !== 'Blank' && item.name !== 'ERROR';
const materialName = ({ rawName = '', name }) => {
  const liquid = rawName.match(/^Liquid(\d)$/)?.[1];
  return liquid ? LIQUID_INFO[liquid - 1]?.displayName ?? '' : cleanUnderscore(name ?? '');
};

// The vial's sentence filled as the game fills it, the vial bonus included
const vialSentence = ({ level = 0, func, x1, x2, desc = '', multiplier = 1 }) =>
  cleanUnderscore(desc.replace(/{|\$/g, gameBonusText(growth(func, level, x1, x2, false) * multiplier)));

// A search finds a vial by its name, what it boosts or its material. Not its liquid: a liquid name ("Water Drops")
// would match every vial that costs it
const matchesSearch = (vial, query) => !query || [vialName(vial), cleanUnderscore(vial?.desc ?? ''),
  ...(vial?.itemReq ?? []).filter((item) => isMaterial(item) && !item.rawName?.startsWith('Liquid')).map(materialName)]
  .some((text) => text.toLowerCase().includes(query));

// The table view: one row per vial, its bottle as the tiles draw it
const VIAL_COLUMNS = [
  {
    key: 'name',
    label: 'Vial',
    icon: (vial) => <VialArt level={vial.level ?? 0} material={`data/${vial.mainItem}.png`} size={28} alt={''}/>,
    value: (vial) => vialName(vial)
  },
  { key: 'level', label: 'Level', kind: 'amount', value: (vial) => vial.level ?? 0 },
  { key: 'bonus', label: 'Bonus', value: (vial) => vialSentence(vial) }
];

// A vial's details on a tap: its sentence, and what its next level costs. A vial at Lv 0 is not found yet, so it has
// no level to buy. With no multiplierText (the vial bonus tile reads "-") the bonus line goes.
const vialNote = (vial, multiplierText) => {
  const { level = 0, multiplier = 1, itemReq = [] } = vial;
  const materials = itemReq.filter(isMaterial);
  return <Stack gap={1}>
    <Stack gap={0.5}>
      <Typography variant={'body2'}>{`${vialName(vial)}, ${formatNum(level, 'level', { max: MAX_VIAL_LEVEL })}`}</Typography>
      <Typography variant={'body2'}>{vialSentence(vial)}</Typography>
      {multiplierText && level > 0 && multiplier > 1 ? <Typography variant={'body2'} color={'text.secondary'}>
        {`${multiplierText(multiplier)} vial bonus`}</Typography> : null}
      {level > 0 ? null : <StatusText status={'needs'}>Not found yet</StatusText>}
      {level >= MAX_VIAL_LEVEL ? <StatusText status={'maxed'}/> : null}
    </Stack>
    {level > 0 && level < MAX_VIAL_LEVEL && materials.length ? <ItemCard.Section label={'Next level'}>
      {materials.map((item) => <ItemCard.Cost key={item.rawName} icon={`data/${item.rawName}_x1.png`}
                                              iconAlt={materialName(item)}
                                              need={item.rawName.startsWith('Liquid') ? 3 * level : vialCostsArray[level]}/>)}
    </ItemCard.Section> : null}
  </Stack>;
};

const Vials = () => {
  const { state } = useContext(AppContext);
  const account = state?.account;
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('vials', VIALS_TOOLBAR);
  const failedSection = Object.keys(SECTION_NAMES).find((section) => isSectionFailed(account, section));
  const alchemyFailed = isSectionFailed(account, 'alchemy');
  // A failed section's {} default: the vials at zero, the parser's own with no save, with no state or note
  const vials = (alchemyFailed ? getAlchemy({}, [], {})?.vials : account?.alchemy?.vials) ?? [];
  const { value: vialBonus, breakdown } = getVialMultiplier(account);
  const attempts = account?.alchemy?.p2w?.vialsAttempts;
  const multiplierText = (value) => formatNum(value || 1, 'mult', { precise: true });
  const vialText = failedSection ? '-' : multiplierText(vialBonus);
  const query = String(toolbar?.search ?? '').trim().toLowerCase();
  const shown = vials.filter((vial) => (alchemyFailed || !toolbar?.hideMaxed || vial.level < MAX_VIAL_LEVEL)
    && matchesSearch(vial, query));

  return <>
    <NextSeo
      title="Vials | Idleon Toolbox"
      description="View your vial levels, upgrade costs, and bonus effects for alchemy progression in Legends of Idleon"
    />
    {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed atZero={alchemyFailed}/> : null}
    <PageSummary>
      <StatTile label={'Vial bonus'} value={vialText}
                breakdown={!failedSection && breakdown ? { ...breakdown, totalValue: vialText } : undefined}/>
      <StatTile label={'Total vial levels'} value={alchemyFailed ? '-' : formatNum(calcVialsLevels(vials))}/>
      {/* CauldronP2W[5]: the attempts left today, as of the save, against the day's total (3 + Pay 2 Win) */}
      <StatTile label={'Material per level'} value={COST_RANGE} sub={'+ 3 liquid per level'} breakdown={COST_BREAKDOWN}
                breakdownTitle={'Material per level'}
                breakdownNoun={'levels'}/>
      <StatTile label={'Daily attempts left'} value={alchemyFailed ? '-' : `${formatNum(Math.max(0, attempts?.current ?? 0))} / ${formatNum(attempts?.max ?? 0)}`}/>
    </PageSummary>
    <Box>
      <Toolbar state={toolbar} defaults={VIALS_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
               total={vials.length} shown={shown.length} noun={'vials'}>
        <Toolbar.Search placeholder={'Search vials'}/>
        {/* A failed section's vials are all at zero: nothing for the filter to hide */}
        {alchemyFailed ? null : <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>}
        <Toolbar.View options={[['tiles', 'Tiles'], ['table', 'Table']]}/>
      </Toolbar>
      {toolbar?.view === 'table'
        // Nothing found draws no table, not a header over nothing
        ? shown.length ? <DataTable columns={VIAL_COLUMNS} rows={shown} rowKey={'name'} rowLabel={vialName}
                                    muted={(vial) => !alchemyFailed && (vial.level ?? 0) === 0}
                                    surface={'card'}/> : null
        : <CardGrid size={'icon'} fill sx={VIAL_GRID_SX}>
        {shown.map((vial) => {
          const level = vial?.level ?? 0;
          const status = alchemyFailed || level > 0 ? undefined : 'missing';
          return <IconTile key={vial.name} height={VIAL_TILE_HEIGHT} value={formatNum(level)} status={status}
                           icon={<VialArt level={level} material={`data/${vial.mainItem}.png`} alt={vialName(vial)} status={status}/>}
                           details={alchemyFailed ? undefined : vialNote(vial, failedSection ? null : multiplierText)}/>;
        })}
      </CardGrid>}
    </Box>
  </>;
};

export default Vials;

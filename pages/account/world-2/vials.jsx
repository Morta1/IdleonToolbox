import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, growth, titleCaseName } from 'utility/helpers';
import { gameBonusText } from '@utility/gameNotation';
import {
  LIQUID_INFO,
  MAX_VIAL_LEVEL,
  calcVialsLevels,
  getAlchemy,
  getVialMultiplier,
  vialCostsArray
} from '@parsers/world-2/alchemy';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import StatusText from '@components/common/StatusText';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

const VIALS_TOOLBAR = { hideMaxed: false };

// The sections the page reads, in the order the note names the first that failed: the vials, and what the vial bonus
// reads besides them (My First Chemistry Set, the Upgrade Vault, the meritocracy bonus and Vial Mastery)
const SECTION_NAMES = {
  alchemy: 'Vials', lab: 'the Lab', upgradeVault: 'the Upgrade Vault', voteBallot: 'the Vote Ballot', rift: 'the Rift'
};

// The page's one name style for a vial ("Copper Corona")
const vialName = (vial) => titleCaseName(cleanUnderscore(vial?.name ?? ''));

const isMaterial = (item) => Boolean(item?.name) && item.name !== 'Blank' && item.name !== 'ERROR';
const materialName = ({ rawName = '', name }) => {
  const liquid = rawName.match(/^Liquid(\d)$/)?.[1];
  return liquid ? LIQUID_INFO[liquid - 1]?.displayName ?? '' : cleanUnderscore(name ?? '');
};

// A vial's details on a tap: its sentence filled as the game fills it (the vial bonus included), and what its next
// level costs. A vial at Lv 0 is not found yet, so it has no level to buy. With no multiplierText (the vial bonus
// tile reads "-") the bonus line goes.
const vialNote = (vial, multiplierText) => {
  const { level = 0, func, x1, x2, desc = '', multiplier = 1, itemReq = [] } = vial;
  const bonus = growth(func, level, x1, x2, false) * multiplier;
  const materials = itemReq.filter(isMaterial);
  return <Stack gap={1}>
    <Stack gap={0.5}>
      <Typography variant={'body2'}>{`${vialName(vial)}, ${formatNum(level, 'level', { max: MAX_VIAL_LEVEL })}`}</Typography>
      <Typography variant={'body2'}>{cleanUnderscore(desc.replace(/{|\$/g, gameBonusText(bonus)))}</Typography>
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
  const multiplierText = (value) => formatNum(value || 1, 'mult', { precise: true });
  const vialText = failedSection ? '-' : multiplierText(vialBonus);
  const shown = !alchemyFailed && toolbar?.hideMaxed ? vials.filter(({ level }) => level < MAX_VIAL_LEVEL) : vials;

  return <>
    <NextSeo
      title="Vials | Idleon Toolbox"
      description="View your vial levels, upgrade costs, and bonus effects for alchemy progression in Legends of Idleon"
    />
    {failedSection ? <MissingData name={SECTION_NAMES[failedSection]} failed/> : null}
    <PageSummary>
      <StatTile label={'Vial bonus'} value={vialText}
                breakdown={!failedSection && breakdown ? { ...breakdown, totalValue: vialText } : undefined}/>
      <StatTile label={'Total vial levels'} value={alchemyFailed ? '-' : formatNum(calcVialsLevels(vials))}/>
    </PageSummary>
    <Box>
      {/* A failed section's vials are all at zero: nothing for the filter to hide */}
      {alchemyFailed ? null : <Toolbar state={toolbar} defaults={VIALS_TOOLBAR} onChange={setToolbar}
                                       onReset={resetToolbar} total={vials.length} shown={shown.length}
                                       noun={'vials'}>
        <Toolbar.Filter name={'hideMaxed'} label={'Hide maxed'}/>
      </Toolbar>}
      <CardGrid size={'icon'}>
        {shown.map((vial) => {
          const level = vial?.level ?? 0;
          return <IconTile key={vial.name} icon={`data/${vial.mainItem}.png`} alt={vialName(vial)}
                           value={formatNum(level)} frame={`data/aVials${Math.min(level, MAX_VIAL_LEVEL) || 1}.png`}
                           status={alchemyFailed || level > 0 ? undefined : 'missing'}
                           details={alchemyFailed ? undefined : vialNote(vial, failedSection ? null : multiplierText)}/>;
        })}
      </CardGrid>
    </Box>
  </>;
};

export default Vials;

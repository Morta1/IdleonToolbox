import { Box, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { cleanUnderscore, formatNum, growth } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import { NextSeo } from 'next-seo';
import { CLASSES, getBestActiveCharacter, getCharacterByHighestTalent, getHighestMaxLevelTalentByClass } from '../../../parsers/talents';
import { getAtomColliderThreshold } from '@parsers/world-3/atomCollider';
import { calcTotals, isPrinterWiredIn } from '@parsers/world-3/printer';
import { OPT } from '@parsers/accountOptions';
import { createBreakdown } from '@parsers/breakdown';
import { items as itemsTable } from '@website-data';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import SheetContext from '@components/common/cards/SheetContext';

const itemName = (rawName) => cleanUnderscore(itemsTable?.[rawName]?.displayName ?? rawName);
// An owner-approved exception to the decimals rule: a tile has no room for 264,736.87 beside its row, and its note keeps them.
const tileValue = (value) => formatNum(value ?? 0, 'whole');

// A group of a character's printer slots in one row of the character sheet's small tiles (SheetContext), 48 px and 3 px
// apart so a 6-digit amount clears the edges, a panel's 12 slots about 615 px, and two characters share a row (#42); the
// group's name is for a screen reader
const SLOT_TILE = 48;
const SlotGroup = ({ label, slots }) => <SheetContext value={{}}>
  <Box role={'group'} aria-label={label}>
    <CardGrid size={'icon'} columns={slots?.length || 1} sheetTile={SLOT_TILE} sx={{ gap: '3px' }}>
      {(slots ?? []).map((slot, slotIndex) => !slot?.item || slot.item === 'Blank'
        ? <IconTile key={`blank-${slotIndex}`} status={'empty'}/>
        : <IconTile key={`${slot.item}-${slotIndex}`} icon={`data/${slot.item}.png`} alt={itemName(slot.item)}
                    value={tileValue(slot.boostedValue)} status={slot.active ? 'active' : undefined}
                    details={`${itemName(slot.item)}: ${slot.active ? 'printing' : 'stored'}, ${formatNum(slot.boostedValue ?? 0)} per hour from a ${formatNum(slot.value ?? 0)} sample`}/>)}
    </CardGrid>
  </Box>
</SheetContext>;

// Printer Go Brrr's hours: the highest Maestro's level, or the max level's hours when nobody has a point in it
const printerGoBrrr = (characters) => {
  const highest = getCharacterByHighestTalent(characters, CLASSES.Maestro, 'PRINTER_GO_BRRR');
  const talent = highest?.flatTalents?.find(({ name }) => name === 'PRINTER_GO_BRRR');
  const hours = talent?.level > 0 ? growth(talent?.funcX, talent?.level, talent?.x1, talent?.x2, false) : 0;
  if (hours > 0) return { hours };
  const maxLevel = getHighestMaxLevelTalentByClass(characters, CLASSES.Maestro, 'PRINTER_GO_BRRR');
  const maxHours = growth(maxLevel?.funcX, maxLevel?.maxLevel, maxLevel?.x1, maxLevel?.x2, false);
  return maxHours > 0 ? { hours: maxHours, atMax: true } : null;
};

const totalNote = (item, total, brrr) => {
  const perHour = total?.boostedValue ?? 0;
  return <Stack gap={0.5}>
    <Typography variant={'body2'}>{`${itemName(item)}: ${formatNum(perHour)} per hour, ${formatNum(perHour * 24)} per day`}</Typography>
    {brrr ? <Typography variant={'body2'}>
      {`${formatNum(perHour * brrr.hours)} from Printer Go Brrr (${formatNum(brrr.hours)} hours${brrr.atMax ? ' at max level' : ''})`}
    </Typography> : null}
    {total?.atoms ? <Typography variant={'body2'}>{`${formatNum(total.atoms * 24, 'amount', { precise: true })} particles per day`}</Typography> : null}
  </Stack>;
};

const Printer = () => {
  const { state } = useContext(AppContext);
  const printerFailed = isSectionFailed(state?.account, 'printer');
  const printer = state?.account?.printer ?? [];
  const { atom, ...totals } = calcTotals({ ...state?.account, printer }) ?? {};
  const atoms = atom?.atoms ?? 0;

  const loggedInCharacter = getBestActiveCharacter(state?.characters);
  const atomThreshold = getAtomColliderThreshold(state?.account?.accountOptions?.[OPT.atomColliderThresholdSetting]);
  const brrr = printerGoBrrr(state?.characters);

  const printerPanel = (slots, index) => {
    const character = state?.characters?.[index];
    const name = cleanUnderscore(character?.name) || `Character ${index + 1}`;
    const sample = character?.printerSample ?? 0;
    const printing = slots?.find((slot) => slot?.item && slot.item !== 'Blank' && slot?.value > 0);
    const multi = printing ? printing.boostedValue / printing.value : undefined;
    const multiText = multi ? formatNum(multi, 'mult') : '-';
    // Every slot prints its sample times this multi, so it is the one breakdown worth a trigger: the sample's
    // breakdown without its Sample row, the numbered group around the rest unwrapped
    const multiNodes = (printing?.breakdown?.tree ?? []).filter((node) => node?.name !== 'Sample');
    const multiRows = multiNodes.length === 1 && multiNodes[0]?.children ? multiNodes[0].children : multiNodes;
    const multiBreakdown = printing?.breakdown ? createBreakdown(`${name} printer multi`, multiText, multiRows) : undefined;
    const meta = [`Sample ${formatNum(Math.min(90, sample), 'pct')}`,
      sample > 90 ? `+${formatNum(sample - 90, 'pct')} past the cap` : null,
      isPrinterWiredIn(character, state?.account, loggedInCharacter) ? 'Wired In' : null].filter(Boolean).join(' · ');
    return <Panel key={`printer-${index}`} icon={`data/ClassIcons${character?.classIndex}.png`} title={name} meta={meta}
                  aside={multiBreakdown
                    ? <Typography variant={'value'} component={'div'}>
                      <Breakdown asValue data={multiBreakdown} title={`${name} printer multi`}>{multiText}</Breakdown>
                    </Typography>
                    : null}>
      {/* The samples, then the two printing slots apart at the panel's right edge (#72) */}
      <Stack direction={'row'} gap={1} alignItems={'flex-start'} justifyContent={'space-between'} sx={{ px: 1, py: 1.5 }}>
        <SlotGroup label={'Samples'} slots={slots?.filter((slot) => !slot?.active)}/>
        <SlotGroup label={'Printing'} slots={slots?.filter((slot) => slot?.active)}/>
      </Stack>
    </Panel>;
  };

  return <>
    <NextSeo
      title="Printer | Idleon Toolbox"
      description="Keep track of your printer output with calculated bonuses from various sources"
    />
    {printerFailed ? <MissingData name={'Printer'} failed/> : !printer.length
      ? <Notice tone={'signin'} sx={{ mb: 2 }}>Each character&apos;s printer shows here once you sign in.</Notice>
      : null}
    <PageSummary>
      <StatTile label={'Atom threshold'} value={formatGame(atomThreshold, 'AtomCollider.AtomThreshold')}/>
      {/* A failed printer section has no output: the tile it feeds shows no number */}
      <StatTile label={'Atoms per hour'} value={printerFailed ? '-' : formatNum(atoms, 'amount', { precise: true })}
                sub={printerFailed ? undefined : `${formatNum(atoms * 24, 'amount', { precise: true })} per day`}/>
    </PageSummary>
    {Object.keys(totals).length ? <>
      <Typography variant={'sectionTitle'} component={'h2'} sx={{ mb: 1.5 }}>Printing per hour</Typography>
      <CardGrid size={'icon'} sx={{ mb: 3 }}>
        {Object.entries(totals).map(([item, total]) => <IconTile key={item} icon={`data/${item}.png`} alt={itemName(item)}
                                                               value={tileValue(total?.boostedValue)}
                                                               mark={total?.atoms ? 'etc/Particle.png' : undefined}
                                                               markAlt={total?.atoms ? 'Makes particles' : undefined}
                                                               details={totalNote(item, total, brrr)}/>)}
      </CardGrid>
    </> : null}
    {/* Two characters a row where the page holds two panels of 12 small slots (about 632 px each); one a row below that */}
    <Box sx={{ containerType: 'inline-size' }}>
      <Box sx={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 1.5, alignItems: 'start',
        '@container (min-width: 1276px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }
      }}>
        {printer.map(printerPanel)}
      </Box>
    </Box>
  </>;
};

export default Printer;

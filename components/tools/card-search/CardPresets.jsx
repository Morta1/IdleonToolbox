import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  IconChevronDown,
  IconChevronUp,
  IconClipboardText,
  IconCopy,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconUserDown,
  IconX
} from '@tabler/icons-react';
import usePageTop from '@hooks/usePageTop';
import { calcCardBonus } from '@parsers/cardMath';
import { getCardBonusByEffect, getCardSlotChipBoosts, withCardLoadout } from '@parsers/cards';
import { getAfkGain, getCashMulti, getDropRate } from '@parsers/character';
import { getMaxDamage } from '@parsers/damage';
import { cashMultiText, formatGame } from '@utility/gameNotation';
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel, { FIELD_INFO_SX } from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';
import InfoButton from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';
import { ImportFromCharacterDialog, PasteTextDialog } from './PresetDialogs';
import { presetToText } from './presetUtils';

const formatEffect = (effect, value) => cleanUnderscore(effect.replace('{', formatNum(value)));
const bonusNow = (card) => (card?.amount > 0 ? calcCardBonus(card) : 0);
const bonusAtMax = (card) => calcCardBonus({ ...card, stars: card?.maxStars ?? card?.stars });
const cardSprite = (card, isSet) => (isSet ? `data/${card.rawName}.png` : `data/2Cards${card.cardIndex}.png`);
const cardLabel = (card, isSet) => cleanUnderscore(isSet ? card.name : card.displayName);
const NO_BOOSTS = Array(8).fill(1);
const CHIP_MARKS = { 0: ['data/ConsoleChip20.png', 'Omega Nanochip: doubled'], 7: ['data/ConsoleChip21.png', 'Omega Motherboard: doubled'] };
// The character screen's stats a card can move, read and printed as /characters prints them
const CRIT_CHANCE_DISPLAY_CAP = 200;
const readStats = (character, account, characters) => {
  const playerInfo = getMaxDamage(character, characters, account) || {};
  return {
    dropRate: getDropRate(character, account, characters)?.dropRate,
    damage: playerInfo.maxDamage,
    // Capped before comparing: two chances past the cap read the same on the character screen
    critChance: Math.min(CRIT_CHANCE_DISPLAY_CAP, playerInfo.critChance),
    afkGains: getAfkGain(character, characters, account)?.afkGains,
    killPerKill: playerInfo.killPerkill?.value,
    killsPerHour: playerInfo.finalKillsPerHour,
    cashMulti: getCashMulti(character, account, characters, playerInfo)?.cashMulti
  };
};
const STATS = [
  { key: 'dropRate', label: 'Drop rate', format: (rate) => `${formatGame(rate, 'TotalStats.Drop_Rarity')}x` },
  { key: 'damage', label: 'Damage', format: (damage) => formatNum(damage) },
  { key: 'critChance', label: 'Crit chance', format: (chance) => formatNum(chance, 'pct') },
  { key: 'afkGains', label: 'AFK gains', format: (gains) => `${formatGame(gains * 100, 'AFKgainrates.Fighting')}%` },
  { key: 'killPerKill', label: 'Kill per kill', format: (kills) => formatNum(kills, 'mult') },
  { key: 'killsPerHour', label: 'Kills per hour', format: (kills) => formatGame(Math.floor(kills), 'ArbitraryCode.KillPerKill') },
  { key: 'cashMulti', label: 'Cash multi', format: (multi) => `${cashMultiText(multi)}x` }
];
const effectName = (effect) => cleanUnderscore(effect.replace(/^\+?\{(%|px)?_/, ''));
const effectAmount = (effect, value) => `${formatNum(value)}${effect.includes('{%') ? '%' : ''}`;
const setText = (set, bonus) => (set?.effect ? formatEffect(set.effect, bonus) : 'None');
const isSame = (a, b) => Math.abs(a - b) < 1e-9;

// "now → preset", the change only when both sides have a value: "0% → 315% (+315%)" said the same number three times
const Change = ({ from, to, format = formatNum }) => <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>
  {format(from)} → {format(to)}
  {from !== 0 && to !== 0 ? <Typography component={'span'} variant={'body2'} color={to > from ? 'text.success' : 'text.error'}>
    {' '}({to > from ? '+' : '-'}{format(Math.abs(to - from))})
  </Typography> : null}
</Box>;

const CompareGroup = ({ title, rows, info }) => (rows.length ? <ItemCard.Section
  label={<Stack component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>{title}{info}</Stack>}>
  <ItemCard.Facts rows={rows}/>
</ItemCard.Section> : null);

// The preset read on one character: every effect either side has, as its value now → with the preset.
// Gains keep slot order so a row maps to its tile; losses go largest first.
const PresetCompare = ({ character, account, characters, cards, cardSet, cardSetBonus, totals, wornBonus }) => {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const wornSet = character?.cards?.cardSet;
  const wornSetBonus = wornSet?.effect ? wornSet.bonus ?? 0 : 0;
  const statsNow = readStats(character, account, characters);
  const statsWith = readStats(withCardLoadout(character, account, cards, cardSet), account, characters);
  const statRows = STATS.filter(({ key }) => Number.isFinite(statsNow[key]) && Number.isFinite(statsWith[key]))
    .map(({ key, label, format }) => [label, format(statsNow[key]) === format(statsWith[key]) ? format(statsNow[key])
      : <Change key={key} from={statsNow[key]} to={statsWith[key]} format={format}/>]);
  const effects = [...new Set([
    ...Object.keys(totals),
    ...(character?.cards?.equippedCards || []).filter((card) => card?.effect && card?.amount > 0).map(({ effect }) => effect)
  ])].map((effect) => ({ effect, from: wornBonus(effect), to: totals[effect]?.now ?? 0, max: totals[effect]?.max ?? 0 }));
  const row = ({ effect, from, to }) => [effectName(effect), <Change key={effect} from={from} to={to} format={(value) => effectAmount(effect, value)}/>];
  const gainEffects = effects.filter(({ from, to }) => to > from && !isSame(from, to));
  const losses = effects.filter(({ from, to }) => to < from && !isSame(from, to)).sort((a, b) => b.from - a.from).map(row);
  const unchanged = effects.filter(({ from, to }) => isSame(from, to));
  const belowMax = effects.filter(({ to, max }) => max > to && !isSame(max, to));
  const sameSet = (wornSet?.name ?? null) === (cardSet?.name ?? null);
  const unchangedCount = unchanged.length + (sameSet && cardSet ? 1 : 0);

  return <Stack gap={1.5}>
    <ItemCard.Facts rows={[
      sameSet ? null : ['Card set', <Stack key={'set'} alignItems={'flex-end'}>
        <span>{setText(cardSet, cardSetBonus)}</span>
        <Typography component={'span'} variant={'body2'} color={'text.secondary'}>now {setText(wornSet, wornSetBonus)}</Typography>
      </Stack>]
    ]}/>
    <CompareGroup title={'Stats'} rows={statRows}
                  info={<InfoButton label={'Stats'}>
                    The character's own stats, with this preset's cards and card set in place of the ones it wears now.
                    STR, AGI, WIS and LUK come from the save, so a card that adds them does not move these numbers.
                  </InfoButton>}/>
    <CompareGroup title={'Gains'} rows={gainEffects.map(row)}
                  info={belowMax.length ? <InfoButton label={'At max stars'}>
                    {belowMax.map(({ effect, max }) => <div key={effect}>{effectName(effect)}: {effectAmount(effect, max)} at max</div>)}
                  </InfoButton> : null}/>
    <CompareGroup title={'Losses'} rows={losses}/>
    {unchangedCount ? <Box>
      <Button sx={{ ml: -1 }} onClick={() => setShowUnchanged(!showUnchanged)} aria-expanded={showUnchanged}>
        {showUnchanged ? 'Hide' : 'Show'} {unchangedCount} unchanged
      </Button>
      {showUnchanged ? <ItemCard.Facts rows={[
        sameSet && cardSet ? ['Card set', setText(cardSet, cardSetBonus)] : null,
        ...unchanged.map(({ effect, to }) => [effectName(effect), effectAmount(effect, to)])
      ]}/> : null}
    </Box> : null}
  </Stack>;
};

// From md the dock sticks under the bar and the band; below md it is a bottom sheet.
const dockSx = (pageTop) => (theme) => ({
  width: 360,
  flexShrink: 0,
  alignSelf: 'flex-start',
  position: 'sticky',
  overflowY: 'auto',
  [theme.breakpoints.up('md')]: { top: pageTop + 8, maxHeight: `calc(100vh - ${pageTop + 24}px - var(--nitro-ad-height, 0px) - var(--consent-banner-height, 0px))` },
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    top: 'auto',
    // Above the bottom anchor ad and the consent banner, as the snackbars sit
    bottom: 'calc(var(--nitro-ad-height, 0px) + var(--consent-banner-height, 0px))',
    left: 0,
    right: 0,
    width: 'auto',
    maxHeight: '75vh',
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: theme.zIndex.appBar,
    bgcolor: 'background.paper',
    borderRadius: '12px 12px 0 0'
  }
});

const CardPresets = ({
                       presets,
                       selected,
                       characters,
                       account,
                       hasAccount,
                       targetSlot,
                       onTargetSlot,
                       onRemoveSlot,
                       onSelect,
                       onChange,
                       onAdd,
                       onCreate,
                       onDelete,
                       onNotify,
                       onClose,
                       getCard,
                       getCardSet,
                       catalogCards,
                       cardSetsData
                     }) => {
  const pageTop = usePageTop();
  const [renaming, setRenaming] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // A dialog opened from the menu hands focus back to the menu's button once it has closed (the row is gone)
  const menuButton = useRef(null);
  const returnFocus = useRef(null);
  const cancelRename = useRef(false);
  // Menu actions that open something focusable wait for the menu to finish closing, or its focus trap takes focus back
  const pendingAction = useRef(null);
  const preset = presets?.[selected];
  const cards = preset?.cards?.map((displayName) => displayName ? getCard(displayName) : null) || [];
  const cardSet = preset?.cardSet ? getCardSet(preset.cardSet) : null;
  const filled = cards.filter(Boolean).length;
  // The character the preset is read on: its chips double slots 1 and 8, and its own cards are what the preset replaces
  const previewCharacter = Number.isInteger(preset?.previewOn) ? characters?.find(({ playerId }) => playerId === preset.previewOn) : null;
  const boosts = previewCharacter ? getCardSlotChipBoosts(account, previewCharacter.playerId) : NO_BOOSTS;
  const wornCards = previewCharacter?.cards?.equippedCards;

  const totals = cards.reduce((res, card, slot) => {
    if (!card) return res;
    const now = bonusNow(card) * boosts[slot];
    const max = bonusAtMax(card) * boosts[slot];
    res[card.effect] = { now: (res[card.effect]?.now || 0) + now, max: (res[card.effect]?.max || 0) + max };
    return res;
  }, {});
  const wornBonus = (effect) => getCardBonusByEffect(wornCards, effect);
  // A card the save has at 0: one it never mentions (a failed cards section) is unknown, not missing
  const isMissing = (card) => hasAccount && card?.amount === 0;
  const missing = cards.filter(isMissing);
  const cardSetBonus = calcCardBonus(cardSet);

  const closeMenu = () => {
    setMenuAnchor(null);
    setConfirmDelete(false);
  };
  const afterMenu = (action) => {
    pendingAction.current = action;
    closeMenu();
  };
  const openDialog = (which, trigger = null) => {
    returnFocus.current = trigger;
    setDialog(which);
    setDialogOpen(true);
  };
  const dialogExited = () => {
    setDialog(null);
    returnFocus.current?.focus();
    returnFocus.current = null;
  };
  const copyPreset = async () => {
    const copied = await copyText(presetToText(preset));
    onNotify({ message: copied ? `Copied ${preset.name} as text` : CLIPBOARD_ERROR_MESSAGE });
  };
  const toggleTarget = (slot) => onTargetSlot(targetSlot === slot ? null : slot);

  const slotTile = (card, slot, isSet) => <IconTile key={isSet ? 'set' : slot}
                                                    icon={card ? cardSprite(card, isSet) : undefined}
                                                    alt={card ? cardLabel(card, isSet) : isSet ? 'Card set slot' : `Slot ${slot + 1}`}
                                                    status={card ? (!isSet && isMissing(card) ? 'missing' : undefined) : 'empty'}
                                                    value={card && !isSet ? formatNum(bonusNow(card) * boosts[slot]) : undefined}
                                                    mark={!isSet && boosts[slot] > 1 ? CHIP_MARKS[slot]?.[0] : undefined}
                                                    markAlt={!isSet && boosts[slot] > 1 ? CHIP_MARKS[slot]?.[1] : undefined}
                                                    markSize={20}
                                                    selected={targetSlot === (isSet ? 'set' : slot)}
                                                    onSelect={() => toggleTarget(isSet ? 'set' : slot)}/>;
  const targetSet = targetSlot === 'set';
  const targeted = targetSet ? cardSet : Number.isInteger(targetSlot) ? cards[targetSlot] : null;
  const targetBoost = Number.isInteger(targetSlot) ? boosts[targetSlot] : 1;
  const targetedNow = targetSet ? cardSetBonus : bonusNow(targeted) * targetBoost;
  const targetedMax = targetSet ? cardSetBonus : targeted ? bonusAtMax(targeted) * targetBoost : 0;

  return <Box sx={dockSx(pageTop)}>
    <Panel title={'Card presets'} sx={{ borderRadius: { xs: '12px 12px 0 0', md: undefined } }}
           aside={<Stack direction={'row'} alignItems={'center'} gap={0.5}>
             {renaming ? <TextField autoFocus defaultValue={preset?.name} sx={{ width: 140 }}
                                    slotProps={{ htmlInput: { 'aria-label': 'Preset name' } }}
                                    onBlur={(e) => {
                                      if (!cancelRename.current) {
                                        onChange({ ...preset, name: e.target.value.trim() || preset.name });
                                      }
                                      cancelRename.current = false;
                                      setRenaming(false);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') cancelRename.current = true;
                                      if (e.key === 'Enter' || e.key === 'Escape') e.target.blur();
                                    }}/>
               : preset ? <TextField select value={selected} sx={{ width: { xs: 100, md: 140 } }} onChange={(e) => onSelect(e.target.value)}
                                     slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Selected preset' } } }}>
                 {presets.map(({ name }, index) => <MenuItem key={`${name}-${index}`} value={index}>{name}</MenuItem>)}
               </TextField> : null}
             <IconButton ref={menuButton} size={'small'} aria-label={'Preset options'} onClick={(e) => setMenuAnchor(e.currentTarget)}>
               <IconDotsVertical size={20}/>
             </IconButton>
             {preset ? <IconButton size={'small'} sx={{ display: { md: 'none' } }} onClick={() => setExpanded(!expanded)}
                                   aria-label={expanded ? 'Collapse preset' : 'Expand preset'} aria-expanded={expanded}>
               {expanded ? <IconChevronDown size={20}/> : <IconChevronUp size={20}/>}
             </IconButton> : null}
             <IconButton size={'small'} aria-label={'Close card presets'} onClick={onClose}><IconX size={20}/></IconButton>
           </Stack>}>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} disableRestoreFocus
            TransitionProps={{
              onExited: () => {
                const action = pendingAction.current;
                pendingAction.current = null;
                if (action === 'rename') setRenaming(true);
                if (action === 'import' || action === 'paste') openDialog(action, menuButton.current);
              }
            }}>
        <MenuItem onClick={() => {
          onCreate();
          closeMenu();
        }}>
          <ListItemIcon><IconPlus size={18}/></ListItemIcon><ListItemText>New preset</ListItemText>
        </MenuItem>
        {characters?.length ? <MenuItem onClick={() => afterMenu('import')}>
          <ListItemIcon><IconUserDown size={18}/></ListItemIcon><ListItemText>Import from a character</ListItemText>
        </MenuItem> : null}
        <MenuItem onClick={() => afterMenu('paste')}>
          <ListItemIcon><IconClipboardText size={18}/></ListItemIcon><ListItemText>Paste from text</ListItemText>
        </MenuItem>
        {/* MUI Menu needs an array of children, not a fragment */}
        {preset ? [
          <MenuItem key={'copy'} onClick={() => {
            copyPreset();
            closeMenu();
          }}>
            <ListItemIcon><IconCopy size={18}/></ListItemIcon><ListItemText>Copy as text</ListItemText>
          </MenuItem>,
          <Divider key={'divider'}/>,
          <MenuItem key={'rename'} onClick={() => afterMenu('rename')}>
            <ListItemIcon><IconPencil size={18}/></ListItemIcon><ListItemText>Rename</ListItemText>
          </MenuItem>,
          <MenuItem key={'delete'} sx={{ color: 'text.error' }} onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            onDelete(selected);
            closeMenu();
          }}>
            <ListItemIcon sx={{ color: 'inherit' }}><IconTrash size={18}/></ListItemIcon>
            <ListItemText>{confirmDelete ? `Delete ${preset.name}?` : 'Delete'}</ListItemText>
          </MenuItem>
        ] : null}
      </Menu>
      <Box sx={{ p: 2 }}>
        {!preset ? <Stack alignItems={'center'} gap={1.5} py={1}>
          <Typography variant={'body2'} color={'text.secondary'} textAlign={'center'}>Plan a loadout before setting it in game</Typography>
          <Button variant={'outlined'} startIcon={<IconPlus size={18}/>} onClick={onCreate}>Create preset</Button>
          <Stack direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
            {characters?.length ? <Button startIcon={<IconUserDown size={18}/>}
                                          onClick={() => openDialog('import')}>Import from a character</Button> : null}
            <Button startIcon={<IconClipboardText size={18}/>}
                    onClick={() => openDialog('paste')}>Paste from text</Button>
          </Stack>
        </Stack> : <>
          {/* The folded sheet on a phone: what the preset holds, and how full it is */}
          <Stack direction={'row'} alignItems={'center'} gap={0.75} flexWrap={'wrap'} sx={{ display: { xs: expanded ? 'none' : 'flex', md: 'none' } }}>
            {cardSet ? <GameIcon src={cardSprite(cardSet, true)} size={32} alt={cardLabel(cardSet, true)}/> : null}
            {cards.filter(Boolean).map((card, index) => <GameIcon key={`${card.displayName}-${index}`} src={cardSprite(card)} size={32} alt={cardLabel(card)}/>)}
            <Typography variant={'body2'} color={'text.secondary'} sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>{filled} / 8</Typography>
          </Stack>

          <Stack gap={1.5} sx={{ display: { xs: expanded ? 'flex' : 'none', md: 'flex' } }}>
            {characters?.length ? <Stack direction={'row'} alignItems={'flex-end'} gap={0.5}>
              <TextField select fullWidth label={'Preview on'} value={preset.previewOn ?? ''}
                                             onChange={(e) => onChange({ ...preset, previewOn: e.target.value === '' ? null : Number(e.target.value) })}>
              <MenuItem value={''}>No character</MenuItem>
              {characters.map(({ name, playerId }) => <MenuItem key={playerId} value={playerId}>{name}</MenuItem>)}
            </TextField>
              {boosts.some((boost) => boost > 1) ? <InfoButton label={'Doubled slots'} sx={FIELD_INFO_SX}>
                {previewCharacter?.name}'s Omega lab chips double the card in {boosts[0] > 1 && boosts[7] > 1 ? 'slots 1 and 8' : boosts[0] > 1 ? 'slot 1' : 'slot 8'}.
              </InfoButton> : null}
            </Stack> : null}
            <CardGrid size={'icon'} columns={1}>{slotTile(cardSet, 'set', true)}</CardGrid>
            <CardGrid size={'icon'} columns={4}>{cards.map((card, slot) => slotTile(card, slot, false))}</CardGrid>
            {targeted ? <Stack gap={0.5}>
              <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} gap={1} flexWrap={'wrap'}>
                <Typography variant={'cardTitle'} component={'h3'}>{cardLabel(targeted, targetSet)}</Typography>
                {isMissing(targeted) && !targetSet ? <StatusText status={'needs'}>Not found yet</StatusText> : null}
              </Stack>
              <ItemCard.Facts rows={[
                ['Bonus now', formatEffect(targeted.effect, targetedNow)],
                targetedMax > targetedNow ? ['At max stars', formatEffect(targeted.effect, targetedMax)] : null
              ]}/>
              <Box><Button onClick={() => onRemoveSlot(targetSlot)} sx={{ ml: -1 }}>Remove from preset</Button></Box>
            </Stack> : <Typography variant={'body2'} color={'text.secondary'}>
              {targetSlot === null ? 'Tap a slot to choose which card the next pick replaces.' : 'The next card you pick goes into this slot.'}
            </Typography>}
            <Divider/>
            {previewCharacter ? <PresetCompare key={previewCharacter.playerId} character={previewCharacter} account={account}
                                               characters={characters} cards={cards} cardSet={cardSet} cardSetBonus={cardSetBonus}
                                               totals={totals} wornBonus={wornBonus}/> : <Stack gap={0.5}>
              {cardSetBonus > 0 ? <Typography variant={'body2'} color={'text.secondary'}>
                {formatEffect(cardSet.effect, cardSetBonus)} (set)
              </Typography> : null}
              {Object.entries(totals).map(([effect, { now, max }]) => <Typography key={effect} variant={'body2'}>
                {formatEffect(effect, now)}
                {max > now ? <Typography component={'span'} variant={'body2'} color={'text.secondary'}>
                  {' '}(max {formatNum(max)})
                </Typography> : null}
              </Typography>)}
              {!cardSetBonus && Object.keys(totals).length === 0 ?
                <Typography variant={'body2'} color={'text.secondary'}>Tap a card's + on the page to add it.</Typography> : null}
            </Stack>}
            {missing.length > 0 ? <Notice tone={'missing'}>
              Not found yet: {missing.map(({ displayName }) => cleanUnderscore(displayName)).join(', ')}
            </Notice> : null}
          </Stack>
        </>}
      </Box>
      {dialog === 'import' ? <ImportFromCharacterDialog characters={characters} getCard={getCard}
                                                         getCardSet={getCardSet} open={dialogOpen}
                                                         onClose={() => setDialogOpen(false)} onExited={dialogExited}
                                                         onImport={(next) => {
                                                           onAdd(next);
                                                           setDialogOpen(false);
                                                           onNotify({ message: `Imported ${next.name}` });
                                                         }}/> : null}
      {dialog === 'paste' ? <PasteTextDialog catalogCards={catalogCards} cardSetsData={cardSetsData}
                                             open={dialogOpen} onClose={() => setDialogOpen(false)} onExited={dialogExited}
                                             onImport={(next, unknown) => {
                                               onAdd(next);
                                               setDialogOpen(false);
                                               onNotify({
                                                 message: unknown
                                                   ? `Imported ${next.name}: ${unknown} unknown name${unknown > 1 ? 's' : ''} skipped`
                                                   : `Imported ${next.name}`
                                               });
                                             }}/> : null}
    </Panel>
  </Box>;
};

export default CardPresets;

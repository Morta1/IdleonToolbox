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
import { cleanUnderscore, formatNum } from 'utility/helpers';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import { ImportFromCharacterDialog, PasteTextDialog } from './PresetDialogs';
import { presetToText } from './presetUtils';

const formatEffect = (effect, value) => cleanUnderscore(effect.replace('{', formatNum(value)));
const bonusNow = (card) => (card?.amount > 0 ? calcCardBonus(card) : 0);
const bonusAtMax = (card) => calcCardBonus({ ...card, stars: card?.maxStars ?? card?.stars });
const cardSprite = (card, isSet) => (isSet ? `data/${card.rawName}.png` : `data/2Cards${card.cardIndex}.png`);
const cardLabel = (card, isSet) => cleanUnderscore(isSet ? card.name : card.displayName);

// From md the dock sticks under the bar and the band; below md it is a bottom sheet.
const dockSx = (pageTop) => (theme) => ({
  width: 360,
  flexShrink: 0,
  alignSelf: 'flex-start',
  position: 'sticky',
  overflowY: 'auto',
  [theme.breakpoints.up('md')]: { top: pageTop + 8, maxHeight: `calc(100vh - ${pageTop + 24}px)` },
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    top: 'auto',
    bottom: 0,
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

  const totals = cards.reduce((res, card) => {
    if (!card) return res;
    const now = bonusNow(card);
    const max = bonusAtMax(card);
    res[card.effect] = { now: (res[card.effect]?.now || 0) + now, max: (res[card.effect]?.max || 0) + max };
    return res;
  }, {});
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
                                                    value={card && !isSet ? formatNum(bonusNow(card)) : undefined}
                                                    selected={targetSlot === (isSet ? 'set' : slot)}
                                                    onSelect={() => toggleTarget(isSet ? 'set' : slot)}/>;
  const targetSet = targetSlot === 'set';
  const targeted = targetSet ? cardSet : Number.isInteger(targetSlot) ? cards[targetSlot] : null;
  const targetedNow = targetSet ? cardSetBonus : bonusNow(targeted);
  const targetedMax = targetSet ? cardSetBonus : targeted ? bonusAtMax(targeted) : 0;

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
               : preset ? <TextField select value={selected} sx={{ width: 140 }} onChange={(e) => onSelect(e.target.value)}
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
            <Stack gap={0.5}>
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
            </Stack>
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

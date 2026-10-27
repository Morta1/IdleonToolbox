import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  IconAlertTriangle,
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
import { CardAndBorder } from '@components/common/styles';
import { navBarHeight } from '@components/constants';
import { calcCardBonus } from '@parsers/cardMath';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { ImportFromCharacterDialog, PasteTextDialog } from './PresetDialogs';
import { presetToText } from './presetUtils';

const round = (value) => Math.round(value * 100) / 100;
const formatEffect = (effect, value) => cleanUnderscore(effect.replace('{', round(value)));

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
  const [renaming, setRenaming] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState(null);
  const cancelRename = useRef(false);
  // Menu actions that open something focusable wait for the menu to finish closing, or its focus trap takes focus back
  const pendingAction = useRef(null);
  const preset = presets?.[selected];
  const cards = preset?.cards?.map((displayName) => displayName ? getCard(displayName) : null) || [];
  const cardSet = preset?.cardSet ? getCardSet(preset.cardSet) : null;
  const filled = cards.filter(Boolean).length;

  const totals = cards.reduce((res, card) => {
    if (!card) return res;
    const now = card?.amount > 0 ? calcCardBonus(card) : 0;
    const max = calcCardBonus({ ...card, stars: card?.maxStars ?? card?.stars });
    res[card.effect] = { now: (res[card.effect]?.now || 0) + now, max: (res[card.effect]?.max || 0) + max };
    return res;
  }, {});
  const missing = hasAccount ? cards.filter((card) => card && !card?.amount) : [];
  const cardSetBonus = calcCardBonus(cardSet);

  const closeMenu = () => {
    setMenuAnchor(null);
    setConfirmDelete(false);
  };
  const afterMenu = (action) => {
    pendingAction.current = action;
    closeMenu();
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(presetToText(preset));
      onNotify({ message: `Copied ${preset.name} as text` });
    } catch {
      onNotify({ message: 'Your browser blocked the clipboard' });
    }
  };
  const toggleTarget = (slot) => onTargetSlot(targetSlot === slot ? null : slot);

  return <Panel variant={'outlined'}>
    <Box className={'handle'}/>
    <Stack direction={'row'} alignItems={'center'} gap={0.5}>
      {renaming ? <TextField size={'small'} fullWidth autoFocus defaultValue={preset?.name}
                             inputProps={{ 'aria-label': 'Preset name' }}
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
        : !preset ? <Typography variant={'h6'} sx={{ flex: 1 }}>Card presets</Typography>
        : <Select size={'small'} fullWidth value={selected}
                  inputProps={{ 'aria-label': 'Selected preset' }}
                  onChange={(e) => onSelect(e.target.value)}>
          {presets.map(({ name }, index) => <MenuItem key={`${name}-${index}`} value={index}>{name}</MenuItem>)}
        </Select>}
      <IconButton size={'small'} aria-label={'Preset options'} onClick={(e) => setMenuAnchor(e.currentTarget)}>
        <IconDotsVertical size={20}/>
      </IconButton>
      <IconButton size={'small'} sx={{ display: { md: 'none' } }} onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? 'Collapse preset' : 'Expand preset'} aria-expanded={expanded}>
        {expanded ? <IconChevronDown size={20}/> : <IconChevronUp size={20}/>}
      </IconButton>
      <IconButton size={'small'} aria-label={'Close card presets'} onClick={onClose}><IconX size={20}/></IconButton>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} disableRestoreFocus
            TransitionProps={{
              onExited: () => {
                const action = pendingAction.current;
                pendingAction.current = null;
                if (action === 'rename') setRenaming(true);
                if (action === 'import' || action === 'paste') setDialog(action);
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
            copyText();
            closeMenu();
          }}>
            <ListItemIcon><IconCopy size={18}/></ListItemIcon><ListItemText>Copy as text</ListItemText>
          </MenuItem>,
          <Divider key={'divider'}/>,
          <MenuItem key={'rename'} onClick={() => afterMenu('rename')}>
            <ListItemIcon><IconPencil size={18}/></ListItemIcon><ListItemText>Rename</ListItemText>
          </MenuItem>,
          <MenuItem key={'delete'} sx={{ color: confirmDelete ? 'error.main' : undefined }} onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            onDelete(selected);
            closeMenu();
          }}>
            <ListItemIcon sx={{ color: 'inherit' }}><IconTrash size={18}/></ListItemIcon>
            <ListItemText>{confirmDelete ? `Delete ${preset.name}?` : 'Delete'}</ListItemText>
          </MenuItem>
        ] : null}
      </Menu>
    </Stack>

    {!preset ? <Stack alignItems={'center'} gap={1.5} py={3}>
      <Typography color={'text.secondary'} textAlign={'center'}>Plan a loadout before setting it in game</Typography>
      <Button variant={'outlined'} startIcon={<IconPlus size={18}/>} onClick={onCreate}>Create preset</Button>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} justifyContent={'center'}>
        {characters?.length ? <Button size={'small'} startIcon={<IconUserDown size={18}/>}
                                      onClick={() => setDialog('import')}>Import from a character</Button> : null}
        <Button size={'small'} startIcon={<IconClipboardText size={18}/>}
                onClick={() => setDialog('paste')}>Paste from text</Button>
      </Stack>
    </Stack> : <>
    <MiniRow sx={{ display: { xs: expanded ? 'none' : 'flex', md: 'none' } }}>
      {[cardSet, ...cards].map((card, index) => card
        ? <img key={`mini-${index}`} alt={cleanUnderscore(index === 0 ? card.name : card.displayName)}
               src={index === 0 ? `${prefix}data/${card.rawName}.png` : `${prefix}data/2Cards${card.cardIndex}.png`}/>
        : <span key={`mini-${index}`} className={'empty'}/>)}
      <Typography variant={'caption'} color={'text.secondary'} sx={{ alignSelf: 'center' }}>{filled}/8</Typography>
    </MiniRow>

    <Box sx={{ display: { xs: expanded ? 'block' : 'none', md: 'block' } }}>
      <Typography variant={'caption'} color={'text.secondary'} component={'div'} mt={1.5} mb={1.5}>
        Click a slot to choose which card the next pick replaces
      </Typography>
      <Stack mb={2} alignItems={'center'}>
        <Slot label={cardSet ? cleanUnderscore(cardSet.name) : 'card set'} targeted={targetSlot === 'set'}
              onTarget={() => toggleTarget('set')} onRemove={cardSet ? () => onRemoveSlot('set') : null}>
          {cardSet ? <CardAndBorder variant={'cardSet'} {...cardSet}/> : <EmptySlot>SET</EmptySlot>}
        </Slot>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 1.5, justifyItems: 'center' }}>
        {cards.map((card, index) => {
          const now = card?.amount > 0 ? calcCardBonus(card) : 0;
          const max = card ? calcCardBonus({ ...card, stars: card?.maxStars ?? card?.stars }) : 0;
          return <Stack key={`slot-${index}`} alignItems={'center'}>
            <Slot label={card ? cleanUnderscore(card.displayName) : `slot ${index + 1}`} targeted={targetSlot === index}
                  onTarget={() => toggleTarget(index)} onRemove={card ? () => onRemoveSlot(index) : null}>
              {card ? <CardAndBorder {...{ ...card, cardName: card.displayName, bonus: now }}/>
                : <EmptySlot><IconPlus size={16}/></EmptySlot>}
            </Slot>
            <SlotValue variant={'caption'}>
              {card ? <>{round(now)}{max > now ?
                <span className={'max'}> / {round(max)}</span> : null}</> : ' '}
            </SlotValue>
          </Stack>
        })}
      </Box>
      <Typography variant={'caption'} color={'text.secondary'} component={'div'} mt={0.5}>
        Under each card: its bonus now / at max stars
      </Typography>
      <Divider sx={{ my: 1.5 }}/>
      <Stack gap={0.5}>
        {cardSetBonus > 0 ? <Typography variant={'body2'} color={'text.secondary'}>
          {cleanUnderscore(cardSet.effect.replace('{', cardSetBonus))} (set)
        </Typography> : null}
        {Object.entries(totals).map(([effect, { now, max }]) => <Typography key={effect} variant={'body2'}>
          {formatEffect(effect, now)}
          {max > now ? <Typography component={'span'} variant={'body2'} color={'text.secondary'}>
            {' '}(max {round(max)})
          </Typography> : null}
        </Typography>)}
        {!cardSetBonus && Object.keys(totals).length === 0 ?
          <Typography variant={'body2'} color={'text.secondary'}>Click cards on the page to add them</Typography> : null}
        {missing.length > 0 ? <Stack direction={'row'} gap={0.5} mt={1} color={'warning.main'}>
          <IconAlertTriangle size={18} style={{ flexShrink: 0 }}/>
          <Typography variant={'body2'}>
            Not found yet: {missing.map(({ displayName }) => cleanUnderscore(displayName)).join(', ')}
          </Typography>
        </Stack> : null}
      </Stack>
    </Box>
    </>}
    {dialog === 'import' ? <ImportFromCharacterDialog characters={characters} getCard={getCard}
                                                       getCardSet={getCardSet}
                                                       onClose={() => setDialog(null)}
                                                       onImport={(next) => {
                                                         onAdd(next);
                                                         setDialog(null);
                                                         onNotify({ message: `Imported ${next.name}` });
                                                       }}/> : null}
    {dialog === 'paste' ? <PasteTextDialog catalogCards={catalogCards} cardSetsData={cardSetsData}
                                           onClose={() => setDialog(null)}
                                           onImport={(next, unknown) => {
                                             onAdd(next);
                                             setDialog(null);
                                             onNotify({
                                               message: unknown
                                                 ? `Imported ${next.name}: ${unknown} unknown name${unknown > 1 ? 's' : ''} skipped`
                                                 : `Imported ${next.name}`
                                             });
                                           }}/> : null}
  </Panel>
};

const Slot = ({ children, label, targeted, onTarget, onRemove }) => <SlotWrapper className={targeted ? 'targeted' : ''}>
  <ButtonBase className={'target'} aria-pressed={targeted} aria-label={`Choose ${label} as the slot to fill`}
              onClick={onTarget}>
    {children}
  </ButtonBase>
  {onRemove ? <IconButton className={'remove'} size={'small'} aria-label={`Remove ${label}`} onClick={onRemove}>
    <IconX size={14}/>
  </IconButton> : null}
</SlotWrapper>;

const Panel = styled(Paper)(({ theme }) => ({
  padding: 16,
  width: 360,
  flexShrink: 0,
  alignSelf: 'flex-start',
  position: 'sticky',
  top: navBarHeight + 8,
  maxHeight: `calc(100vh - ${navBarHeight + 24}px)`,
  overflowY: 'auto',
  '.handle': { display: 'none' },
  [theme.breakpoints.down('md')]: {
    position: 'fixed',
    top: 'auto',
    bottom: 0,
    left: 0,
    right: 0,
    width: 'auto',
    maxHeight: '75vh',
    paddingTop: 8,
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
    zIndex: theme.zIndex.appBar,
    borderRadius: '12px 12px 0 0',
    '.handle': { display: 'block', width: 36, height: 4, borderRadius: 2, background: theme.palette.divider, margin: '0 auto 8px' }
  }
}));

const MiniRow = styled(Box)(({ theme }) => ({
  marginTop: 12,
  gap: 6,
  justifyContent: 'space-between',
  'img, .empty': { width: 28, height: 36, objectFit: 'contain' },
  '.empty': { border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }
}));

const SlotWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '.target': { borderRadius: 6, padding: 3 },
  '&.targeted .target': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
    background: theme.palette.action.selected
  },
  '.remove': {
    position: 'absolute',
    top: -8,
    right: -10,
    padding: 2,
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    opacity: 0
  },
  '&:hover .remove, &.targeted .remove, .remove:focus-visible': { opacity: 1 },
  '@media (hover: none)': { '.remove': { opacity: 1 } }
}));

const EmptySlot = styled(Box)(({ theme }) => ({
  width: 56,
  height: 72,
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: 5,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  fontSize: 12
}));

const SlotValue = styled(Typography)(({ theme }) => ({
  // Clears the star border image, which hangs below the card
  marginTop: 12,
  fontSize: 11,
  lineHeight: 1.3,
  '.max': { color: theme.palette.text.secondary }
}));

export default CardPresets;

import React, { useState } from 'react';
import {
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { cleanUnderscore } from 'utility/helpers';
import { getCharacterLoadouts, textToPreset } from './presetUtils';
import AppDialog from '@components/common/Overlays/AppDialog';
import GameIcon from '@components/common/GameIcon';

// open and onExited: the caller keeps a dialog mounted until it has closed, to hand focus back where it came from
export const ImportFromCharacterDialog = ({ characters, getCard, getCardSet, onImport, onClose, open = true, onExited }) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const character = characters?.[characterIndex];
  const loadouts = getCharacterLoadouts(character);

  return <AppDialog open={open} onClose={onClose} onExited={onExited} size="m" title="Import from a character">
    <TextField select fullWidth value={characterIndex} sx={{ mt: 1 }}
               slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Character' } } }}
               onChange={(e) => setCharacterIndex(e.target.value)}>
      {characters?.map(({ name }, index) => <MenuItem key={`${name}-${index}`} value={index}>{name}</MenuItem>)}
    </TextField>
    <Stack gap={1.5} mt={2}>
      {loadouts.length ? loadouts.map((loadout) => {
        const cardSet = loadout.cardSet ? getCardSet(loadout.cardSet) : null;
        return <Stack key={loadout.label} direction={'row'} alignItems={'center'} gap={1}>
          <Stack sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant={'body2'}>{loadout.label}</Typography>
            <Stack direction={'row'} gap={0.5} flexWrap={'wrap'} sx={{ mt: 0.5 }}>
              {cardSet ? <GameIcon src={`data/${cardSet.rawName}.png`} size={24} alt={cleanUnderscore(cardSet.name)}/> : null}
              {loadout.cards.filter(Boolean).map((displayName, index) => <GameIcon key={`${displayName}-${index}`} size={24} alt={cleanUnderscore(displayName)}
                                                                                   src={`data/2Cards${getCard(displayName)?.cardIndex}.png`}/>)}
            </Stack>
          </Stack>
          <Button variant={'outlined'} aria-label={`Import ${loadout.label}`}
                  onClick={() => onImport({
                    name: `${character.name} ${loadout.label.toLowerCase()}`,
                    cardSet: loadout.cardSet,
                    cards: loadout.cards
                  })}>
            Import
          </Button>
        </Stack>
      }) : <Typography variant={'body2'} color={'text.secondary'}>{character?.name} has no cards equipped</Typography>}
    </Stack>
  </AppDialog>
};

export const PasteTextDialog = ({ catalogCards, cardSetsData, onImport, onClose, open = true, onExited }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const { preset, unknown } = textToPreset(text, catalogCards, cardSetsData);
    if (!preset.cards.some(Boolean) && !preset.cardSet) {
      return setError('No card names found. Paste text copied with "Copy as text".');
    }
    onImport(preset, unknown);
  };

  return <AppDialog open={open} onClose={onClose} onExited={onExited} size="s" title="Paste from text" dirty={Boolean(text)}
                    actions={[{ label: 'Cancel' }, { label: 'Import preset', main: true, onClick: submit }]}>
    <Typography variant={'body2'} color={'text.secondary'} mb={1.5}>
      {'A name line, an optional "Set:" line, then card names separated by commas'}
    </Typography>
    <TextField multiline minRows={4} fullWidth autoFocus value={text}
               placeholder={'Active EXP\nSet: Bosses\nMoonmoon, Demon Genie, Poop'}
               inputProps={{ 'aria-label': 'Preset text' }}
               error={Boolean(error)} helperText={error || ' '}
               onChange={(e) => {
                 setText(e.target.value);
                 setError('');
               }}/>
  </AppDialog>
};

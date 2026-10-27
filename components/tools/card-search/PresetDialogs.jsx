import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { cleanUnderscore, prefix } from 'utility/helpers';
import { getCharacterLoadouts, textToPreset } from './presetUtils';

export const ImportFromCharacterDialog = ({ characters, getCard, getCardSet, onImport, onClose }) => {
  const [characterIndex, setCharacterIndex] = useState(0);
  const character = characters?.[characterIndex];
  const loadouts = getCharacterLoadouts(character);

  return <Dialog open onClose={onClose} fullWidth maxWidth={'xs'}>
    <DialogTitle>Import from a character</DialogTitle>
    <DialogContent>
      <Select size={'small'} fullWidth value={characterIndex} sx={{ mt: 1 }}
              inputProps={{ 'aria-label': 'Character' }}
              onChange={(e) => setCharacterIndex(e.target.value)}>
        {characters?.map(({ name }, index) => <MenuItem key={`${name}-${index}`} value={index}>{name}</MenuItem>)}
      </Select>
      <Stack gap={1.5} mt={2}>
        {loadouts.length ? loadouts.map((loadout) => {
          const cardSet = loadout.cardSet ? getCardSet(loadout.cardSet) : null;
          return <Stack key={loadout.label} direction={'row'} alignItems={'center'} gap={1}>
            <Stack sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant={'body2'}>{loadout.label}</Typography>
              <MiniRow direction={'row'} gap={0.5}>
                {cardSet ? <img src={`${prefix}data/${cardSet.rawName}.png`} alt={cleanUnderscore(cardSet.name)}/> : null}
                {loadout.cards.map((displayName, index) => displayName
                  ? <img key={`${displayName}-${index}`} alt={cleanUnderscore(displayName)}
                         src={`${prefix}data/2Cards${getCard(displayName)?.cardIndex}.png`}/>
                  : <span key={`empty-${index}`} className={'empty'}/>)}
              </MiniRow>
            </Stack>
            <Button size={'small'} variant={'outlined'}
                    onClick={() => onImport({
                      name: `${character.name} ${loadout.label.toLowerCase()}`,
                      cardSet: loadout.cardSet,
                      cards: loadout.cards
                    })}>
              Import
            </Button>
          </Stack>
        }) : <Typography color={'text.secondary'}>{character?.name} has no cards equipped</Typography>}
      </Stack>
    </DialogContent>
    <DialogActions><Button onClick={onClose}>Cancel</Button></DialogActions>
  </Dialog>
};

export const PasteTextDialog = ({ catalogCards, cardSetsData, onImport, onClose }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const { preset, unknown } = textToPreset(text, catalogCards, cardSetsData);
    if (!preset.cards.some(Boolean) && !preset.cardSet) {
      return setError('No card names found. Paste text copied with "Copy as text".');
    }
    onImport(preset, unknown);
  };

  return <Dialog open onClose={onClose} fullWidth maxWidth={'xs'}>
    <DialogTitle>Paste from text</DialogTitle>
    <DialogContent>
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
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant={'contained'} onClick={submit}>Import</Button>
    </DialogActions>
  </Dialog>
};

const MiniRow = styled(Stack)(({ theme }) => ({
  marginTop: 4,
  'img, .empty': { width: 24, height: 31, objectFit: 'contain' },
  '.empty': { border: `1px dashed ${theme.palette.divider}`, borderRadius: 3 }
}));

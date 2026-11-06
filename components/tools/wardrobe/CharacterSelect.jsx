import React from 'react';
import { Box, MenuItem, Stack, TextField } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { cleanUnderscore } from '@utility/helpers';

const classIcon = ({ classIndex }) => <GameIcon src={`data/ClassIcons${classIndex}.png`} size={24} alt={''}/>;
const NO_ICON = <Box component={'span'} sx={{ display: 'inline-block', width: 24, height: 24 }}/>;

// With a loaded profile the outfit comes from one of its characters, or from a blank mannequin.
// Without a profile there is nothing to choose, so the control does not render at all.
const CharacterSelect = ({ characters = [], characterName, onPickCharacter }) => {
  if (!characters.length) return null;
  const renderRow = (value) => {
    const character = characters.find((c) => c.name === value);
    return <Stack direction={'row'} alignItems={'center'} gap={0.75}>
      <Box component={'span'} sx={{ color: 'text.secondary' }}>Character</Box>
      {character ? classIcon(character) : null}
      {cleanUnderscore(character?.name) || 'Blank mannequin'}
    </Stack>;
  };
  return <TextField select value={characterName ?? ''} sx={{ minWidth: 240, alignSelf: 'flex-start', maxWidth: '100%' }}
                    onChange={(e) => onPickCharacter(characters.find((c) => c.name === e.target.value))}
                    slotProps={{ select: { displayEmpty: true, renderValue: renderRow, SelectDisplayProps: { 'aria-label': 'Character' } } }}>
    <MenuItem value={''} sx={{ gap: 1 }}>{NO_ICON}Blank mannequin</MenuItem>
    {characters.map((character) => <MenuItem key={character.name} value={character.name} sx={{ gap: 1 }}>
      {classIcon(character)}
      {cleanUnderscore(character.name)}
    </MenuItem>)}
  </TextField>;
};

export default CharacterSelect;

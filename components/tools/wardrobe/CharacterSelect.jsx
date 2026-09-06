import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { prefix } from '@utility/helpers';

// With a loaded profile the outfit comes from one of its characters, or from a blank mannequin.
// Without a profile there is nothing to choose, so the control does not render at all.
const CharacterSelect = ({ characters = [], characterName, onPickCharacter }) => {
  if (!characters.length) return null;
  const renderRow = (value) => {
    if (!value) return <Stack direction={'row'} alignItems={'center'} gap={1}>
      <Box width={24} height={24}/>
      <Typography>Blank mannequin</Typography>
    </Stack>;
    const character = characters.find((c) => c.name === value);
    if (!character) return null;
    return <Stack direction={'row'} alignItems={'center'} gap={1}>
      <img src={`${prefix}data/ClassIcons${character.classIndex}.png`} alt="" width={24} height={24}/>
      <Typography>{character.name}</Typography>
    </Stack>;
  };
  return <FormControl size={'small'} sx={{ minWidth: 220 }}>
    <InputLabel id={'wardrobe-character-label'} shrink>Character</InputLabel>
    <Select labelId={'wardrobe-character-label'} id={'wardrobe-character'} label={'Character'}
            value={characterName ?? ''}
            displayEmpty
            renderValue={renderRow}
            sx={{ '& .MuiSelect-select': { display: 'flex', alignItems: 'center' } }}
            onChange={(e) => onPickCharacter(characters.find((c) => c.name === e.target.value))}>
      <MenuItem value={''}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <Box width={24} height={24}/>
          <Typography>Blank mannequin</Typography>
        </Stack>
      </MenuItem>
      {characters.map((character) => <MenuItem key={character.name} value={character.name}>
        <Stack direction={'row'} alignItems={'center'} gap={1}>
          <img src={`${prefix}data/ClassIcons${character.classIndex}.png`} alt="" width={24} height={24}/>
          <Typography>{character.name}</Typography>
        </Stack>
      </MenuItem>)}
    </Select>
  </FormControl>;
};

export default CharacterSelect;

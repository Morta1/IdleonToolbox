import { Box, MenuItem, Stack, TextField } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { PageHeaderControl } from '@components/common/NavBar/PageHeader';
import { cleanUnderscore } from '@utility/helpers';

const classIcon = (character) => (character?.classIndex !== undefined ? `data/ClassIcons${character?.classIndex}.png` : 'afk_targets/Nothing.png');

// A tool's page-wide character picker, in the header by the title: "Character" inside the field, the class sprite before
// each name. value and onChange speak a character's playerId, as a string.
const HeaderCharacterPicker = ({ characters, value, onChange }) => <PageHeaderControl>
  <TextField select value={value ?? ''} onChange={(event) => onChange(event.target.value)} sx={{ minWidth: 200, flex: { xs: 1, sm: 'none' } }}
             slotProps={{
               select: {
                 renderValue: (id) => {
                   const character = characters?.find(({ playerId }) => String(playerId) === String(id));
                   return <Stack direction={'row'} alignItems={'center'} gap={0.75}>
                     <Box component={'span'} sx={{ color: 'text.secondary' }}>Character</Box>
                     <GameIcon src={classIcon(character)} size={24} alt={''}/>
                     {cleanUnderscore(character?.name)}
                   </Stack>;
                 },
                 SelectDisplayProps: { 'aria-label': 'Character' }
               }
             }}>
    {characters?.map((character) => <MenuItem key={character?.playerId} value={String(character?.playerId)} sx={{ gap: 1 }}>
      <GameIcon src={classIcon(character)} size={24} alt={''}/>
      {cleanUnderscore(character?.name)}
    </MenuItem>)}
  </TextField>
</PageHeaderControl>;

export default HeaderCharacterPicker;

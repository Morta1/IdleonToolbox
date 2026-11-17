import { Stack, Typography } from '@mui/material';
import InfoButton from '@components/common/InfoButton';
import React from 'react';

// What a colour does that its own text leaves out, read from where the game uses PaletteBonus
const NOTES = {
  // game: PlayerBuildSpd, which a player cog's Flaggy Rate (^0.85) and Construction EXP (^0.7) are built from
  25: {
    line: 'Also raises Flaggy Rate and Construction EXP',
    note: 'Peachy Pink raises the Build Rate of player cogs. A player cog\'s Flaggy Rate and Construction EXP are worked out from its Build Rate, so they rise too. Other cogs are not affected.'
  },
  // game: nothing reads PaletteBonus 36
  36: {
    line: 'Not used by the game yet',
    note: 'The game never reads this colour\'s bonus, so levelling it changes nothing for now.'
  }
};

// inline: inside the board's hex note (another tooltip), so the line stands alone
const PaletteNote = ({ index, name, inline }) => {
  const entry = NOTES[index];
  if (!entry) return null;
  return <Stack direction={'row'} alignItems={'center'} gap={0.5}>
    <Typography variant={'body2'} color={'text.secondary'}>{entry.line}</Typography>
    {!inline ? <InfoButton label={name}>{entry.note}</InfoButton> : null}
  </Stack>;
};

export default PaletteNote;

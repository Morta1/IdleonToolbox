import { Box, Stack, Typography } from '@mui/material';
import GameIcon from '@components/common/GameIcon';

// The next bonus to get, always in view under a clicker's Mega tiles. The ones owned are already in the page's numbers and keep
// their hover, but this is the one a player plans for. They unlock in order; with all owned there is nothing to say.
const NextBonus = ({ entries, name, iconOf, textOf }) => {
  const index = (entries ?? []).findIndex((entry) => !entry?.unlocked);
  if (index < 0) return null;
  // Under the tiles on the page, not in a Panel's footer: no line or inset of its own
  return <Stack direction={'row'} alignItems={'center'} gap={1.5}>
    <GameIcon src={iconOf(index)} size={28} alt={''}/>
    <Typography variant={'body2'} component={'div'} sx={{ minWidth: 0 }}>
      <Box component={'span'} sx={{ fontWeight: 500 }}>Next {name}:</Box> {textOf(entries[index])}
    </Typography>
  </Stack>;
};

export default NextBonus;

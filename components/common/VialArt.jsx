import { Box } from '@mui/material';
import GameIcon from '@components/common/GameIcon';
import { MAX_VIAL_LEVEL } from '@parsers/world-2/alchemy';

// A vial with its material inside the bottle. The bottle's 104 x 120 art fits the square; the material sits on the
// globe's middle, 7/15 across and 8/15 down, where main's vials page drew it. It takes 4/7 of the square against that
// page's 7/15: below its 120 px bottle the material's canvas padding left it too small to read.
const VialArt = ({ level, material, size = 56, alt = '', status }) => {
  const inner = Math.round(size * 4 / 7);
  return <Box component={'span'} sx={{ position: 'relative', display: 'inline-block', flexShrink: 0, width: size, height: size }}>
    <GameIcon src={`data/aVials${Math.min(level, MAX_VIAL_LEVEL) || 1}.png`} size={size} fit={'canvas'} alt={''} status={status}/>
    <Box component={'span'} sx={{
      position: 'absolute',
      display: 'inline-flex',
      left: Math.round(size * 7 / 15 - inner / 2),
      top: Math.round(size * 8 / 15 - inner / 2)
    }}>
      <GameIcon src={material} size={inner} fit={'canvas'} alt={alt} status={status}/>
    </Box>
  </Box>;
};

export default VialArt;

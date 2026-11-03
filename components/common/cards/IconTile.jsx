import { Box, ButtonBase, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import { numOrNode } from '@components/common/Num';
import { cardState, cardSurface } from './tokens';

// A count, or a green ▲ when the thing can level up.
const Badge = ({ badge }) => <Box component={'span'} sx={{
  position: 'absolute',
  top: 3,
  right: 3,
  minWidth: 16,
  height: 16,
  px: badge === 'up' ? 0 : 0.5,
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: '16px',
  color: 'background.default',
  bgcolor: badge === 'up' ? 'success.main' : 'text.secondary'
}}>
  {badge === 'up' ? <><span aria-hidden={'true'}>▲</span><Box component={'span'} sx={visuallyHidden}>Can level up</Box></> : badge}
</Box>;

// IconTile (Cards board): a sprite and one number, packed tight, for grids scanned at a glance. 72 px
// square, the sprite in a 40 px box, game frames behind it; narrower only where its grid keeps a fixed column
// count (CardGrid columns), as wide as its cell. Missing greys the sprite, empty is a dashed slot, active and
// selected are the ItemCard lines. details open on click, tap, Enter or hover. mark is a game mark on the sprite's
// corner (the Rat King's crown on a crowned plant, the greenstack symbol), named for a screen reader by markAlt; a tile
// carries a badge or a mark, not both. fallback is a second sprite GameIcon tries first if the icon is missing.
// onSelect makes the tile a button that picks it, for a grid too large to draw a note per tile (the Slab's 1,935
// items): the page shows the picked one's details once, and selected draws the selected line.
const IconTile = ({ icon, fallback, alt = '', value, kind, frame, badge, mark, markAlt, status, details, onSelect, selected }) => {
  const empty = status === 'empty';
  const tile = <Box sx={[
    (theme) => cardSurface(theme),
    (theme) => cardState(theme, selected ? 'selected' : status),
    {
      position: 'relative',
      width: '100%',
      maxWidth: 72,
      height: 72,
      px: 0.5,
      pt: 0.75,
      pb: 0.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    empty && { bgcolor: 'transparent', borderStyle: 'dashed', borderColor: 'action.disabled' }
  ]}>
    {icon && !empty ? <GameIcon src={icon} fallback={fallback} size={40} alt={alt} frame={frame}
                                status={status === 'missing' ? 'missing' : undefined}/> : null}
    {value !== undefined && !empty ? <Typography component={'div'} variant={'caption'} sx={{
      fontWeight: 500,
      lineHeight: '16px',
      fontVariantNumeric: 'tabular-nums',
      color: status === 'missing' ? 'text.muted' : 'text.primary'
    }}>{numOrNode(value, kind)}</Typography> : null}
    {badge !== undefined && badge !== null ? <Badge badge={badge}/>
      : mark && !empty ? <Box component={'span'} sx={{ position: 'absolute', top: 2, right: 2, display: 'inline-flex' }}>
        <GameIcon src={mark} size={24} alt={markAlt ?? ''}/>
      </Box> : null}
  </Box>;
  if (onSelect) {
    return <ButtonBase component={'span'} disableRipple aria-pressed={Boolean(selected)} onClick={onSelect}
                       sx={{ display: 'flex', width: '100%', maxWidth: 72, borderRadius: '8px' }}>{tile}</ButtonBase>;
  }
  // block: the trigger fills the grid cell, so the tile's width follows the cell
  return details ? <NoteTrigger note={details} block>{tile}</NoteTrigger> : tile;
};

export default IconTile;

import { Box, ButtonBase, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import { numOrNode } from '@components/common/Num';
import UpTriangle from '@components/common/UpTriangle';
import { cardState, cardSurface } from './tokens';

// A count on a disc, or a plain green triangle in the corner when the thing can level up.
const Badge = ({ badge }) => (badge === 'up'
  ? <Box component={'span'} sx={{ position: 'absolute', top: 4, right: 4, display: 'inline-flex' }}>
    <UpTriangle/>
    <Box component={'span'} sx={visuallyHidden}>Can level up</Box>
  </Box>
  : <Box component={'span'} sx={{
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 16,
    height: 16,
    px: 0.5,
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: '16px',
    color: 'background.default',
    bgcolor: 'text.secondary'
  }}>{badge}</Box>);

// IconTile (Cards board): a sprite and one number, packed tight, for grids scanned at a glance. 72 px
// square, the sprite in a 40 px box, game frames behind it; narrower only where its grid keeps a fixed column
// count (CardGrid columns), as wide as its cell. Missing greys the sprite, empty is a dashed slot, active and
// selected are the ItemCard lines. details open on click, tap, Enter or hover. mark is a game mark on the sprite's
// corner (the Rat King's crown on a crowned plant, the greenstack symbol), named for a screen reader by markAlt; a tile
// carries a badge or a mark, not both. fallback is a second sprite GameIcon tries first if the icon is missing.
// onSelect makes the tile a button that picks it, for a grid too large to draw a note per tile (the Slab's 1,935
// items): the page shows the picked one's details once, and selected draws the selected line. An empty slot draws no
// sprite, so its alt names it ("Empty slot" by default) when it has details to open; one with none is not a button.
// phoneDetails go with onSelect: below 600 px, where the page's details Panel does not show, a pick also pins the
// picked tile's details as its note (sized to a table), so the grid keeps the screen.
const IconTile = ({ icon, fallback, alt = '', value, kind, frame, badge, mark, markAlt, status, details, onSelect, selected,
  phoneDetails }) => {
  const empty = status === 'empty';
  const hasValue = value !== undefined && !empty;
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
    // A tile with no number keeps no room for one: its sprite sits in the middle
    !hasValue && { py: 0.5, justifyContent: 'center' },
    empty && { bgcolor: 'transparent', borderStyle: 'dashed', borderColor: 'action.disabled' }
  ]}>
    {icon && !empty ? <GameIcon src={icon} fallback={fallback} size={40} alt={alt} frame={frame}
                                status={status === 'missing' ? 'missing' : undefined}/> : null}
    {hasValue ? <Typography component={'div'} variant={'caption'} sx={{
      fontSize: 13,
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
  if (onSelect && phoneDetails) {
    return <NoteTrigger note={phoneDetails} table phoneOnly onPick={onSelect} block
                        buttonProps={{ 'aria-pressed': Boolean(selected) }}
                        sx={{ maxWidth: 72, borderRadius: '8px' }}>{tile}</NoteTrigger>;
  }
  if (onSelect) {
    return <ButtonBase component={'span'} disableRipple aria-pressed={Boolean(selected)} onClick={onSelect}
                       sx={{ display: 'flex', width: '100%', maxWidth: 72, borderRadius: '8px' }}>{tile}</ButtonBase>;
  }
  // block: the trigger fills the grid cell, so the tile's width follows the cell
  return details ? <NoteTrigger note={details} label={empty ? alt || 'Empty slot' : undefined} block>{tile}</NoteTrigger> : tile;
};

export default IconTile;

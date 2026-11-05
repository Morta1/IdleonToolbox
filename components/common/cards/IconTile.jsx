import { Box, ButtonBase, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import { numOrNode } from '@components/common/Num';
import UpTriangle from '@components/common/UpTriangle';
import { useSheet } from './SheetContext';
import { cardState, cardSurface, emptySlot } from './tokens';

// A count on a disc, or a plain green triangle in the corner when the thing can level up.
const Badge = ({ badge, small }) => (badge === 'up'
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
    bgcolor: 'text.secondary',
    // The small tile's rank (the characters board's .rk)
    ...(small ? { minWidth: 15, height: 15, px: '2px', fontWeight: 500, lineHeight: '15px', color: 'text.primary', bgcolor: 'action.selected' } : {})
  }}>{badge}</Box>);

// The small tile, inside a sheet (the characters board's .t): as wide as its column, a 28 px sprite, no surface of its own.
// Its tile is as narrow as 41 px, where a value of seven characters (451,025) would run into the next one: such a tile
// is a container, and its value draws smaller only while the tile is too narrow for it.
const LONG_VALUE = 7;
const LONG_VALUE_SX = { '@container (max-width: 49.95px)': { fontSize: 11 } };
const smallTileSx = (hasValue, empty) => ({
  position: 'relative',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: '6px',
  bgcolor: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1px',
  p: hasValue ? '5px 1px 4px' : '7px 1px',
  ...(empty ? { minHeight: 44 } : {})
});

// A fill grid lifts this, so a tile fills its column.
const TILE_MAX = 'var(--tile-max, 72px)';

// IconTile (Cards board): a sprite and one number, packed tight, for grids scanned at a glance. 72 px
// square, the sprite in a 40 px box, game frames behind it; narrower only where its grid keeps a fixed column
// count (CardGrid columns), as wide as its cell. icon is a sprite's path, or a node for art a sprite and a frame can't
// draw (VialArt), with height the tile's own for it. Missing greys the sprite, empty is a dashed slot, active and
// selected are the ItemCard lines. details open on click, tap, Enter or hover. mark is a game mark on the sprite's
// corner (the Rat King's crown on a crowned plant, the greenstack symbol), named for a screen reader by markAlt; a tile
// carries a badge or a mark, not both. fallback is a second sprite GameIcon tries first if the icon is missing.
// onSelect makes the tile a button that picks it, for a grid too large to draw a note per tile (the Slab's 1,935
// items): the page shows the picked one's details once, and selected draws the selected line. An empty slot draws no
// sprite, so its alt names it ("Empty slot" by default) when it has details to open or can be picked; one with neither
// is not a button.
// phoneDetails go with onSelect: below 600 px, where the page's details Panel does not show, a pick also pins the
// picked tile's details as its note (sized to a table), so the grid keeps the screen.
// sub: a dimmer line under the value, inside a sheet (a talent's "/ max").
const IconTile = ({ icon, fallback, alt = '', value, kind, sub, frame, height = 72, badge, mark, markAlt, status, details, onSelect, selected,
  phoneDetails }) => {
  const small = Boolean(useSheet());
  const empty = status === 'empty';
  const hasValue = value !== undefined && !empty;
  const emptyName = empty ? alt || 'Empty slot' : undefined;
  const longValue = small && hasValue && value?.length >= LONG_VALUE;
  const tile = <Box sx={[
    (theme) => cardSurface(theme),
    (theme) => cardState(theme, selected ? 'selected' : status),
    small ? smallTileSx(hasValue, empty) : {
      position: 'relative',
      width: '100%',
      maxWidth: TILE_MAX,
      height,
      px: 0.5,
      pt: 0.75,
      pb: 0.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    // A tile with no number keeps no room for one: its sprite sits in the middle
    !small && !hasValue && { py: 0.5, justifyContent: 'center' },
    longValue && { containerType: 'inline-size' },
    empty && emptySlot
  ]}>
    {icon && !empty ? (typeof icon === 'string'
      ? <GameIcon src={icon} fallback={fallback} size={small ? 28 : 40} alt={alt} frame={frame}
                  status={status === 'missing' ? 'missing' : undefined}/>
      : icon) : null}
    {hasValue ? <Typography component={'div'} variant={'caption'} sx={{
      ...(longValue ? LONG_VALUE_SX : {}),
      fontSize: 13,
      fontWeight: 500,
      lineHeight: '16px',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: small ? 'nowrap' : undefined,
      color: status === 'missing' ? 'text.muted' : 'text.primary'
    }}>{numOrNode(value, kind)}</Typography> : null}
    {small && sub && !empty ? <Typography component={'div'} variant={'caption'} color={'text.muted'} sx={{
      fontSize: 12,
      lineHeight: '14px',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap'
    }}>{sub}</Typography> : null}
    {badge !== undefined && badge !== null ? <Badge badge={badge} small={small}/>
      : mark && !empty ? <Box component={'span'} sx={{ position: 'absolute', top: 2, right: 2, display: 'inline-flex' }}>
        <GameIcon src={mark} size={24} alt={markAlt ?? ''}/>
      </Box> : null}
  </Box>;
  if (onSelect && phoneDetails) {
    return <NoteTrigger note={phoneDetails} label={emptyName} table phoneOnly onPick={onSelect} block
                        buttonProps={{ 'aria-pressed': Boolean(selected) }}
                        sx={{ maxWidth: TILE_MAX, borderRadius: '8px' }}>{tile}</NoteTrigger>;
  }
  if (onSelect) {
    return <ButtonBase component={'span'} disableRipple aria-label={emptyName} aria-pressed={Boolean(selected)} onClick={onSelect}
                       sx={small ? { display: 'flex', width: '100%', alignItems: 'stretch', borderRadius: '6px' }
                         : { display: 'flex', width: '100%', maxWidth: TILE_MAX, borderRadius: '8px' }}>{tile}</ButtonBase>;
  }
  // block: the trigger fills the grid cell, so the tile's width follows the cell, and inside a sheet its row's height
  return details ? <NoteTrigger note={details} label={emptyName} block sx={small ? { alignItems: 'stretch', borderRadius: '6px' } : undefined}>{tile}</NoteTrigger> : tile;
};

export default IconTile;

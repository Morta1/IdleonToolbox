import { Box, ButtonBase, Typography } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import GameIcon from '@components/common/GameIcon';
import { NOTE_ANCHOR, NoteTrigger, SHARED_NOTE_ID } from '@components/common/InfoButton';
import { numOrNode } from '@components/common/Num';
import UpTriangle from '@components/common/UpTriangle';
import { useSheet } from './SheetContext';
import { cardState, cardSurface, emptySlot } from './tokens';

// A count on a disc, or a plain green triangle in the corner when the thing can level up. color: the disc's own colour, a
// palette path (a skill's top 3 ranks wear the podium's medals), with dark words on it.
const Badge = ({ badge, small, color }) => (badge === 'up'
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
    ...(small ? { minWidth: 15, height: 15, px: '2px', fontWeight: 500, lineHeight: '15px', color: 'text.primary', bgcolor: 'action.selected' } : {}),
    ...(color ? { bgcolor: color, color: 'common.black', fontWeight: 700 } : {})
  }}>{badge}</Box>);

// glow: a palette path, drawn round the sprite's own outline (a re-rolled obol). On the sprite's box, not the image: the box
// clips the image, so a square sprite's glow was cut away. A solid edge and a halo: a gold sprite swallowed a soft glow alone.
const glowSx = (glow) => (theme) => {
  const color = glow.split('.').reduce((node, key) => node?.[key], (theme.vars || theme).palette);
  return { '& > span:has(> img)': { filter: `drop-shadow(0 0 1px ${color}) drop-shadow(0 0 1px ${color}) drop-shadow(0 0 5px ${color})` } };
};

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
// progress: how far the thing is to its next level, 0 to 1, as a 3 px bar along the tile's foot (a shrine's EXP). The
// numbers are in the tile's note; the bar is only the glance, so it is hidden from a screen reader.
const ProgressFoot = ({ progress }) => <Box component={'span'} aria-hidden sx={{
  position: 'absolute', left: 8, right: 8, bottom: 4, height: 3, borderRadius: '2px', bgcolor: 'divider', overflow: 'hidden'
}}>
  <Box component={'span'} sx={{
    display: 'block', height: '100%', width: `${Math.min(100, Math.max(0, progress * 100))}%`,
    bgcolor: progress >= 1 ? 'success.main' : 'primary.main'
  }}/>
</Box>;
// label: the thing's name under its sprite, for a collection whose sprites alone can't be told apart (hats, companions).
// Two lines at most, and always the room of two: a one-line name keeps its tile as tall as its neighbours, so a row of
// tiles lines up whatever the names.
const LABEL_SX = {
  fontSize: 12, lineHeight: '15px', minHeight: 30, color: 'text.secondary', textAlign: 'center', maxWidth: '100%',
  overflowWrap: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
};

// IconTile (Cards board): a sprite and one number, packed tight, for grids scanned at a glance. 72 px
// square, the sprite in a 40 px box, game frames behind it; narrower only where its grid keeps a fixed column
// count (CardGrid columns), as wide as its cell. icon is a sprite's path, or a node for art a sprite and a frame can't
// draw (VialArt), with height the tile's own for it. Missing greys the sprite, empty is a dashed slot, active and
// selected are the ItemCard lines. details open on click, tap, Enter or hover. mark is a game mark on the sprite's
// corner (the Rat King's crown on a crowned plant, the greenstack symbol), named for a screen reader by markAlt; a tile
// carries a badge or a mark, not both.
// onSelect makes the tile a button that picks it, for a grid too large to draw a note per tile: the page shows the
// picked one's details once, and selected draws the selected line. An empty slot draws no sprite, so its alt names it
// ("Empty slot" by default) when it has details to open or can be picked; one with neither is not a button.
// sharedNote goes with onSelect: the tile's key in the note its page shares across the grid (InfoButton's SharedNote). A
// mouse over it previews the note; a click hands event.currentTarget over as the anchor, and selected says the note is kept
// open on it (the Slab's 1,938 items).
// buttonProps go with onSelect, onto the tile's button (the mark a page finds its tile by).
// sub: a dimmer line under the value, inside a sheet (a talent's "/ max"). kind is what numOrNode takes. frameAbove: the
// frame over the sprite (GameIcon's). iconSize: 40 in a sheet where the sprite is all a tile says (talents, skills, obols,
// equipment): the sheet's 28 px left a talent a speck in its cell. badgeColor and glow: see Badge and glowSx; progress: see
// ProgressFoot. markSize: 20 for a grid of tiles under 64 px (Statues'), where a 24 px mark hid half the sprite.
const IconTile = ({ icon, alt = '', value, kind, sub, label, frame, frameAbove, iconSize, height = 72, badge, badgeColor, mark, markAlt,
  markSize = 24, glow, progress, status, details, onSelect, selected, sharedNote, buttonProps }) => {
  const small = Boolean(useSheet());
  const empty = status === 'empty';
  const hasProgress = typeof progress === 'number' && Number.isFinite(progress) && !small && !empty;
  const hasValue = value !== undefined && !empty;
  const hasLabel = Boolean(label) && !small && !empty;
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
    hasLabel && { height: 'auto', minHeight: height, justifyContent: 'flex-start', gap: '2px', pt: 0.75, pb: 0.75 },
    longValue && { containerType: 'inline-size' },
    // The value sits above the bar, not on it
    hasProgress && { pb: '9px' },
    empty && emptySlot,
    glow && !empty ? glowSx(glow) : null
  ]}>
    {icon && !empty ? (typeof icon === 'string'
      ? <GameIcon src={icon} size={iconSize ?? (small ? 28 : 40)} alt={alt} frame={frame} frameAbove={frameAbove}
                  status={status === 'missing' ? 'missing' : undefined}/>
      : icon) : null}
    {hasLabel ? <Typography component={'div'} sx={LABEL_SX}>{label}</Typography> : null}
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
    {hasProgress ? <ProgressFoot progress={progress}/> : null}
    {badge !== undefined && badge !== null ? <Badge badge={badge} small={small} color={badgeColor}/>
      : mark && !empty ? <Box component={'span'} sx={{ position: 'absolute', top: markSize < 24 ? 1 : 2, right: markSize < 24 ? 1 : 2, display: 'inline-flex' }}>
        <GameIcon src={mark} size={markSize} alt={markAlt ?? ''}/>
      </Box> : null}
  </Box>;
  if (onSelect) {
    return <ButtonBase component={'span'} disableRipple aria-label={emptyName} onClick={onSelect}
                       {...(sharedNote
                         ? { [NOTE_ANCHOR]: sharedNote, 'aria-expanded': Boolean(selected), 'aria-describedby': selected ? SHARED_NOTE_ID : undefined }
                         : { 'aria-pressed': Boolean(selected) })}
                       {...buttonProps}
                       sx={small ? { display: 'flex', width: '100%', alignItems: 'stretch', borderRadius: '6px' }
                         : { display: 'flex', width: '100%', maxWidth: TILE_MAX, borderRadius: '8px' }}>{tile}</ButtonBase>;
  }
  // block: the trigger fills the grid cell, so the tile's width follows the cell, and inside a sheet its row's height
  return details ? <NoteTrigger note={details} label={emptyName} block sx={small ? { alignItems: 'stretch', borderRadius: '6px' } : undefined}>{tile}</NoteTrigger> : tile;
};

export default IconTile;

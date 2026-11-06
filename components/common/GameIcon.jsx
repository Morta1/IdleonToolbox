import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { prefix } from 'utility/helpers';
import { fitSprite, unionBounds, useSpriteBounds } from '@utility/spriteBounds';

// The whole canvas at 90%: a sprite with no bounds entry fills its canvas, so this is its drawn fit.
const WHOLE = { inset: '5%', width: '90%', height: '90%' };
const CANVAS = { inset: 0, width: '100%', height: '100%' };

const placement = (allBounds, src, frame, size, fit) => {
  if (fit === 'canvas') return CANVAS;
  const own = allBounds?.[src];
  const drawn = frame ? unionBounds(own, allBounds?.[frame]) : own;
  return drawn ? fitSprite(drawn, size) : WHOLE;
};

// The box a sprite takes and where its img sits in it.
const layoutOf = (allBounds, src, { frame, size, fit, side, cover, height }) => {
  if (fit === 'bounds') {
    const [canvasWidth, canvasHeight] = size;
    const [, , x0, y0, x1, y1] = allBounds?.[src] ?? [canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight];
    return {
      box: { width: x1 - x0, height: y1 - y0 },
      place: { ...CANVAS, objectFit: 'none', objectPosition: `${-x0}px ${-y0}px` }
    };
  }
  if (fit === 'within') {
    const [width, height] = size;
    return { box: { width, height }, place: { ...CANVAS, objectFit: 'scale-down' } };
  }
  if (fit === 'strip') {
    return {
      box: { width: size, height: size },
      place: { ...CANVAS, objectFit: cover ? 'cover' : 'none', objectPosition: side === 'right' ? '100% 50%' : '0 50%' }
    };
  }
  if (height) return { box: { width: 'auto', height }, place: { position: 'static', display: 'block', width: 'auto', height } };
  return { box: { width: size, height: size }, place: placement(allBounds, src, frame, size, fit) };
};

// One game sprite in a fixed square box (Icons board). size is one of 16 (in text), 24 (cost lines,
// tiles, toolbars), 32 (rows), 40 (cards), 56 (large); anything else is a bug, except that fit="canvas" may take a game
// screen's own size (the palette's 96 px hex). Construction's board keeps its own art (SLOT_ART_SX: the board is the
// game's picture). By default the pixels the
// sprite draws (data/sprite-bounds.json) fill 90% of the box, centered, so a padded canvas (copper ore,
// a tachyon) reads at the size of a full one (a stamp) and no page nudges it. fit="canvas" keeps the
// whole canvas, for spots that copy an in-game screen (inventory, equipment), where a ring is meant to
// look smaller than a hat. src and frame are paths under public/ with the extension; the frame is drawn
// behind and shares the sprite's fit. alt is '' when a label sits beside the icon, the thing's name when
// it stands alone. status="missing" (locked, not found) greys the sprite without shrinking it. loading: "lazy" in a long list.
// Art that isn't an icon keeps the same missing-art box, alt, loading and pending mark. fit="bounds": word art and game
// labels, at the game's own pixels, cropped to what they draw; size is the canvas, [width, height], until the bounds
// arrive. fit="within": a banner in a box of size, [width, height], at its own pixels unless it is bigger. fit="strip": one
// end of a long UI strip as a square of size, at its own pixels, or its whole height with cover; side is 'left' or 'right'.
// height (with fit="bounds" absent): a banner at a fixed height, its width following. className: for a parent that marks
// its icon, as MUI's Tab does.
const GameIcon = ({ src, size = 40, alt = '', frame, status, fit = 'drawn', loading, side = 'left', cover, height, className }) => {
  const allBounds = useSpriteBounds();
  const [failed, setFailed] = useState([]);

  const { box, place } = layoutOf(allBounds, src, { frame, size, fit, side, cover, height });
  if (src && failed.includes(src)) {
    return <MissingArt className={className} style={{ width: box.width === 'auto' ? box.height : box.width, height: box.height, fontSize: Math.max(10, box.height / 2) }}
                       role={alt ? 'img' : undefined} aria-label={alt || undefined}
                       aria-hidden={alt ? undefined : true}>?</MissingArt>;
  }

  const fail = () => setFailed((list) => (list.includes(src) ? list : [...list, src]));
  // An image that failed before hydration fired its error before React was listening.
  const checkFailed = (img) => {
    if (img?.complete && img.naturalWidth === 0) fail();
  };
  return <Box className={className} style={box} data-status={status}
              data-fit={(fit === 'drawn' || fit === 'bounds') && !allBounds ? 'pending' : undefined}>
    {frame ? <img src={`${prefix}${frame}`} alt={''} style={place}/> : null}
    {src ? <img key={src} ref={checkFailed} src={`${prefix}${src}`} alt={alt} style={place} loading={loading}
                  onError={fail}/> : null}
  </Box>;
};

const Box = styled('span')`
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  overflow: hidden;
  vertical-align: middle;

  & img {
    position: absolute;
    object-fit: contain;
  }

  &[data-status='missing'] img {
    opacity: .35;
    filter: grayscale(1);
  }
`;

// No sprite to draw: a dashed box the icon's size with a ?, never the browser's broken image. The edge is
// action.disabled, white 30% in the dark scheme, the board's dashed line.
export const MissingArt = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  verticalAlign: 'middle',
  boxSizing: 'border-box',
  border: `1px dashed ${(theme.vars || theme).palette.action.disabled}`,
  borderRadius: 6,
  color: (theme.vars || theme).palette.text.muted,
  fontWeight: 500,
  lineHeight: 1
}));

export default GameIcon;

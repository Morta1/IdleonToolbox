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

// One game sprite in a fixed square box (Icons board). size is one of 16 (in text), 24 (cost lines,
// tiles, toolbars), 32 (rows), 40 (cards), 56 (large); anything else is a bug. By default the pixels the
// sprite draws (data/sprite-bounds.json) fill 90% of the box, centered, so a padded canvas (copper ore,
// a tachyon) reads at the size of a full one (a stamp) and no page nudges it. fit="canvas" keeps the
// whole canvas, for spots that copy an in-game screen (inventory, equipment), where a ring is meant to
// look smaller than a hat. src and frame are paths under public/ with the extension; the frame is drawn
// behind and shares the sprite's fit. alt is '' when a label sits beside the icon, the thing's name when
// it stands alone. status="missing" (locked, not found) greys the sprite without shrinking it.
const GameIcon = ({ src, size = 40, alt = '', frame, status, fit = 'drawn' }) => {
  const allBounds = useSpriteBounds();
  const [failedSrc, setFailedSrc] = useState(null);

  if (src && failedSrc === src) {
    return <MissingArt style={{ width: size, height: size, fontSize: Math.max(10, size / 2) }}
                       role={alt ? 'img' : undefined} aria-label={alt || undefined}
                       aria-hidden={alt ? undefined : true}>?</MissingArt>;
  }

  // An image that failed before hydration fired its error before React was listening.
  const checkFailed = (img) => {
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
  };
  const place = placement(allBounds, src, frame, size, fit);
  return <Box style={{ width: size, height: size }} data-status={status}
              data-fit={fit === 'drawn' && !allBounds ? 'pending' : undefined}>
    {frame ? <img src={`${prefix}${frame}`} alt={''} style={place}/> : null}
    {src ? <img ref={checkFailed} src={`${prefix}${src}`} alt={alt} style={place}
                onError={() => setFailedSrc(src)}/> : null}
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
const MissingArt = styled('span')(({ theme }) => ({
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

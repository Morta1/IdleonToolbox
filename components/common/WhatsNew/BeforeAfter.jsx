import { useEffect, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ON_ART } from '@utility/colorSets';
import { focusRing } from '../../../styles/theme/theme';

const START = 50;
const SWEEP_MS = 1400;
const SWEEP_REACH = 26;
// Beyond a label's own width: 10 px from the line and 8 from the picture's edge.
const LABEL_ROOM = 18;
// Past this a finger has said what it's doing: along the picture it's the line's, down it the phone sheet's, or the sheet's
// scroll. The same 3 px and the same test as the sheet's own (MUI's SwipeableDrawer), so the two can't both think it's theirs:
// a sheet that takes a swipe cancels the scroll, so the browser's pointercancel never comes to stop the line.
const TOUCH_SLOP = 3;

const IMAGE_SX = {
  position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'left top',
  pointerEvents: 'none', WebkitUserDrag: 'none'
};
const LABEL_SX = {
  position: 'absolute', top: 8, px: 1, py: '5px', borderRadius: '4px', fontSize: 12, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap',
  bgcolor: ON_ART.plate, color: ON_ART.text, pointerEvents: 'none',
  '@media (prefers-reduced-motion: no-preference)': { transition: 'opacity .12s' }
};

// Two pictures of one frame, the upper clipped at a line the player moves: a drag, a tap, or the real range input underneath
// for the keyboard. before and after: { src, alt, label }. The images stay when their sources change, so a browser holds the
// old picture until the new one is ready, and a picture that was preloaded swaps with no flash.
const BeforeAfter = ({ before, after, sx }) => {
  const stage = useRef(null);
  const range = useRef(null);
  const beforeImage = useRef(null);
  const afterImage = useRef(null);
  const beforeLabel = useRef(null);
  const afterLabel = useRef(null);
  const frame = useRef(null);
  const sweepId = useRef(0);
  const press = useRef(null);
  const swept = useRef(new Set());

  const place = (value) => {
    stage.current.style.setProperty('--pos', `${value}%`);
    range.current.value = value;
    // Each label rides beside the line on its own picture's side, and goes when that side has no room left for it.
    const width = stage.current.clientWidth;
    const left = (width * value) / 100;
    beforeLabel.current.style.opacity = left < beforeLabel.current.offsetWidth + LABEL_ROOM ? 0 : 1;
    afterLabel.current.style.opacity = width - left < afterLabel.current.offsetWidth + LABEL_ROOM ? 0 : 1;
  };
  const stop = () => {
    sweepId.current += 1;
    cancelAnimationFrame(frame.current);
  };
  const sweep = () => {
    const start = performance.now();
    const tick = (now) => {
      const progress = (now - start) / SWEEP_MS;
      if (progress >= 1) {
        place(START);
        return;
      }
      place(START + SWEEP_REACH * Math.sin(progress * 2 * Math.PI));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  // Before the paint: a new picture never shows for a frame at the old one's line.
  useLayoutEffect(() => {
    place(START);
  }, [before.src, after.src]);

  // Once the pair is in, or the sweep would pass over an empty frame. Only the first time each picture shows.
  useEffect(() => {
    if (swept.current.has(after.src)) return undefined;
    swept.current.add(after.src);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    sweepId.current += 1;
    const id = sweepId.current;
    Promise.all([beforeImage.current.decode(), afterImage.current.decode()]).then(() => {
      if (id === sweepId.current) sweep();
    }, () => {});
    return stop;
  }, [after.src]);

  const fromPointer = (event) => {
    const box = stage.current.getBoundingClientRect();
    place(Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100)));
  };
  const takeLine = (event) => {
    press.current.line = true;
    fromPointer(event);
    // The browser reads this focus as the keyboard's, because of the mouse down below: the ring waits for a real key.
    stage.current.dataset.byPointer = '';
    range.current.focus({ preventScroll: true });
  };
  const keyboardsTurn = () => {
    delete stage.current.dataset.byPointer;
  };
  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = { x: event.clientX, y: event.clientY, line: false };
    // A finger waits to say what it's doing: a swipe down that starts here shouldn't move the line on its way.
    if (event.pointerType !== 'touch') takeLine(event);
  };
  const handlePointerMove = (event) => {
    if (!press.current) return;
    if (press.current.line) {
      fromPointer(event);
      return;
    }
    const across = Math.abs(event.clientX - press.current.x);
    const down = Math.abs(event.clientY - press.current.y);
    if (Math.max(across, down) <= TOUCH_SLOP) return;
    if (down > across) press.current = null;
    else takeLine(event);
  };
  const handlePointerUp = (event) => {
    // A tap: the finger never moved, so it's a place on the picture, not a swipe.
    if (press.current && !press.current.line) takeLine(event);
    press.current = null;
  };

  return <Box ref={stage} data-testid="before-after" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp} onPointerCancel={() => {
                press.current = null;
              }}
              // The press would move focus off the range: this keeps it there, so the arrow keys carry on from a drag.
              onMouseDown={(event) => event.preventDefault()}
              sx={[(theme) => ({
                '--pos': `${START}%`, position: 'relative', overflow: 'hidden', borderRadius: '6px', border: 1, borderColor: 'divider',
                bgcolor: 'action.hover', cursor: 'ew-resize', touchAction: 'pan-y', userSelect: 'none',
                '&:not([data-by-pointer]) input:focus-visible ~ [data-line] [data-knob]': focusRing(theme)
              }), sx]}>
    <Box component="img" ref={afterImage} src={after.src} alt={after.alt} draggable={false} decoding="sync" sx={IMAGE_SX}/>
    <Box component="img" ref={beforeImage} src={before.src} alt={before.alt} draggable={false} decoding="sync"
         sx={{ ...IMAGE_SX, clipPath: 'inset(0 calc(100% - var(--pos)) 0 0)' }}/>
    <Box component="input" ref={range} type="range" min={0} max={100} step={2} defaultValue={START}
         aria-label="Move the line between the two pictures" onKeyDown={keyboardsTurn} onBlur={keyboardsTurn}
         onChange={(event) => {
           stop();
           place(Number(event.target.value));
         }}
         sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', m: 0, opacity: 0, pointerEvents: 'none' }}/>
    <Box data-line sx={{
      position: 'absolute', top: 0, bottom: 0, left: 'var(--pos)', width: 2, ml: '-1px', bgcolor: ON_ART.text,
      boxShadow: `0 0 0 1px ${ON_ART.plate}`, pointerEvents: 'none'
    }}>
      <Box data-knob data-on-art aria-hidden sx={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 34, height: 34, borderRadius: '50%',
        display: 'grid', placeItems: 'center', bgcolor: ON_ART.text, color: ON_ART.outline, fontSize: 13, fontWeight: 700, lineHeight: 1,
        whiteSpace: 'nowrap', boxShadow: `0 1px 4px ${ON_ART.plate}`
      }}>
        ‹ ›
      </Box>
    </Box>
    <Box ref={beforeLabel} data-on-art data-testid="before-after-label" sx={{ ...LABEL_SX, right: 'calc(100% - var(--pos) + 10px)' }}>
      {before.label}
    </Box>
    <Box ref={afterLabel} data-on-art data-testid="before-after-label" sx={{ ...LABEL_SX, left: 'calc(var(--pos) + 10px)' }}>
      {after.label}
    </Box>
  </Box>;
};

export default BeforeAfter;

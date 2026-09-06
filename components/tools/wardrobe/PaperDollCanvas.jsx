import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { prefix } from '@utility/helpers';
import { CANVAS, resolveLayers } from '@utility/paperDoll';
import { nameLabelOps } from '@utility/nameLabel';

// Draws the paper doll on a <canvas> at an integer scale. The animation clock and the latest
// props live in refs so the rAF loop never re-renders React: state changes are picked up on the
// next frame. Sheets are loaded once per file and cached for the component's lifetime.

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

// The body draws at scale 2 in world px, so a canvas scale of 4 puts every unscaled label pixel
// (the nametag, the name letters and the trophy) on a whole 2x2 block instead of half a pixel.
const DEFAULT_SCALE = 4;
// Sheets are keyed "layer/anim.png" and label art is a bare file name, so the two never collide
// in the one image cache even though they load from different directories.
const SPRITE_BASE = 'player-sprites/';
const LABEL_BASE = 'data/';

const PaperDollCanvas = ({ manifest, state, playing = true, scale = DEFAULT_SCALE, onUnsupported, canvasRef }) => {
  const localRef = useRef(null);
  const ref = canvasRef ?? localRef;
  const images = useRef(new Map());
  // The manifest ships ~63 sheets across every hat, weapon, cape and costume in the game, but a
  // single loadout draws at most five of them (cape, body, costume, weapon, hat). This is a static
  // host with no server-side "give me just these" endpoint, so the only way to avoid shipping the
  // rest to every visitor is to fetch a sheet only once the draw loop actually asks for it.
  // `inFlight` dedupes concurrent requests for the same file across frames; `failed` remembers a
  // load failure so a broken/renamed sheet is warned about once and then left alone instead of
  // being re-requested every frame.
  const inFlight = useRef(new Set());
  const failed = useRef(new Set());
  const latest = useRef({ state, playing, onUnsupported });
  useEffect(() => {
    latest.current = { state, playing, onUnsupported };
  });
  const clock = useRef({ start: 0, pausedAt: null });
  const lastUnsupported = useRef('');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    clock.current.start = performance.now();

    // Fires a load for `file` the first time anything asks for it; loads race each other freely
    // (parallel is fine, there are at most five in flight at once for a given loadout) and each
    // just fills in the shared cache when it lands.
    const ensureLoaded = (file, base = SPRITE_BASE) => {
      if (images.current.has(file) || inFlight.current.has(file) || failed.current.has(file)) return;
      inFlight.current.add(file);
      loadImage(`${prefix}${base}${file}`).then((img) => {
        inFlight.current.delete(file);
        if (img) images.current.set(file, img);
        else {
          failed.current.add(file);
          console.warn(`wardrobe: could not load ${base}${file}`);
        }
      });
    };

    // nameLabelOps needs the natural size of every label piece already in the cache. The cache only
    // ever grows, so the map is rebuilt when its size changes rather than on every frame.
    const labelSizes = { count: -1, value: {} };
    const sizesForLabel = () => {
      if (labelSizes.count !== images.current.size) {
        labelSizes.count = images.current.size;
        labelSizes.value = {};
        for (const [file, img] of images.current) labelSizes.value[file] = { w: img.naturalWidth, h: img.naturalHeight };
      }
      return labelSizes.value;
    };

    const draw = (now) => {
      const { state: s, playing: p, onUnsupported: report } = latest.current;
      if (!p && clock.current.pausedAt == null) clock.current.pausedAt = now;
      if (p && clock.current.pausedAt != null) {
        clock.current.start += now - clock.current.pausedAt;
        clock.current.pausedAt = null;
      }
      const tick = (clock.current.pausedAt ?? now) - clock.current.start;

      const { layers, unsupported } = resolveLayers(manifest, s, tick);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const op of layers) {
        const img = images.current.get(op.file);
        if (!img) { ensureLoaded(op.file); continue; }
        const destX = (CANVAS.anchorX + op.dx) * scale;
        const destY = (CANVAS.anchorY + op.dy) * scale;
        const destW = op.w * scale * (op.drawScale ?? 1);
        const destH = op.h * scale * (op.drawScale ?? 1);
        if (op.flip) {
          // op.dx already describes the mirrored top-left, so the flip pivots on the drawn box.
          ctx.save();
          ctx.translate(destX + destW, destY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, op.sx, op.sy, op.w, op.h, 0, 0, destW, destH);
          ctx.restore();
        } else ctx.drawImage(img, op.sx, op.sy, op.w, op.h, destX, destY, destW, destH);
      }

      // The name label is its own actor on a higher layer than the body, and it is never scaled:
      // its ops are world px around the same feet origin, so they halve into sprite px here.
      if (s.name) {
        const ops = nameLabelOps({
          name: s.name, nametagId: s.nametag?.ID, trophyId: s.trophy?.ID,
          nameFont: manifest.nameFont, sizes: sizesForLabel()
        });
        for (const op of ops) {
          const img = images.current.get(op.file);
          if (!img) { ensureLoaded(op.file, LABEL_BASE); continue; }
          ctx.drawImage(img,
            (CANVAS.anchorX * 2 + op.x) * scale / 2, (CANVAS.anchorY * 2 + op.y) * scale / 2,
            img.naturalWidth * scale / 2, img.naturalHeight * scale / 2);
        }
      }

      const key = unsupported.join(',');
      if (key !== lastUnsupported.current) {
        lastUnsupported.current = key;
        report?.(unsupported);
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [manifest, scale, ref]);

  return <Box sx={{ display: 'inline-block', lineHeight: 0, background: '#1f2833', borderRadius: 2 }}>
    {/* height auto keeps the aspect when a narrow viewport shrinks the width */}
    <canvas ref={ref} width={CANVAS.width * scale} height={CANVAS.height * scale}
            style={{ width: '100%', maxWidth: CANVAS.width * 3, height: 'auto', display: 'block' }}/>
  </Box>;
};

export default PaperDollCanvas;

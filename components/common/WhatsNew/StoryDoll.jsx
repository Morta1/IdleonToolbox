import { useEffect, useRef } from 'react';
import { prefix } from '@utility/helpers';
import { CANVAS, resolveLayers } from '@utility/paperDoll';
import { nameLabelOps } from '@utility/nameLabel';
import { drawLabel, drawLayers, LABEL_BASE, SPRITE_BASE } from '@components/tools/wardrobe/PaperDollCanvas';
import manifest from '../../../data/player-sprites-manifest.json';
import css from './story.module.css';

export const IDLE = '0';
export const WALK = '1';

// Wide enough for any gear's reach (PLAYER_REACH_LEFT, and as much again to the right), with no pet: the wardrobe's anchor sits
// off-centre to leave a pet its room, and a mirrored doll has to turn on its own feet. Scale 2 keeps each label pixel whole.
const REACH = 76;
const SCALE = 2;
const AT = { scale: SCALE, anchorX: REACH, anchorY: CANVAS.anchorY };

// One cache for the whole crew: most of them share sheets.
const images = new Map();
const loads = new Map();
const load = (file, base) => {
  if (!loads.has(file)) {
    loads.set(file, new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images.set(file, image);
        resolve();
      };
      // A sheet that won't come is left out of the drawing, and asked for only once.
      image.onerror = () => resolve();
      image.src = `${prefix}${base}${file}`;
    }));
  }
  return loads.get(file);
};
const imageFrom = (base) => (file) => {
  if (!images.has(file)) load(file, base);
  return images.get(file);
};
const spriteImage = imageFrom(SPRITE_BASE);
const labelImage = imageFrom(LABEL_BASE);

const labelSizes = { count: -1, value: {} };
const sizesForLabel = () => {
  if (labelSizes.count !== images.size) {
    labelSizes.count = images.size;
    labelSizes.value = Object.fromEntries([...images].map(([file, image]) => [file, { w: image.naturalWidth, h: image.naturalHeight }]));
  }
  return labelSizes.value;
};

const labelOps = (loadout) => nameLabelOps({
  name: loadout.name, nametagId: loadout.nametag?.ID, trophyId: loadout.trophy?.ID, nameFont: manifest.nameFont, sizes: sizesForLabel()
});

// Every sheet a character needs in both poses, so nobody walks in half dressed.
export const prepareCrew = (crew) => Promise.all(crew.flatMap((loadout) => [
  ...[IDLE, WALK].flatMap((pose) => resolveLayers(manifest, { ...loadout, pose }, 0).layers.map(({ file }) => load(file, SPRITE_BASE))),
  ...labelOps(loadout).map(({ file }) => load(file, LABEL_BASE))
]));

const paint = (context, loadout, { pose, mirrored, named }, tick) => {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  drawLayers(context, resolveLayers(manifest, { ...loadout, pose }, tick).layers, spriteImage, { ...AT, mirrored });
  if (named) drawLabel(context, labelOps(loadout), labelImage, AT);
};

// A character drawn live from its loadout, on its own clock. pace: how fast its steps go, 0 to hold still (reduced motion). held:
// a ref the story sets while it's paused.
const StoryDoll = ({ loadout, pose = IDLE, pace = 1, mirrored = false, named = true, held }) => {
  const canvas = useRef(null);
  const latest = useRef({ pose, pace, mirrored, named });
  useEffect(() => {
    latest.current = { pose, pace, mirrored, named };
  });
  useEffect(() => {
    const context = canvas.current.getContext('2d');
    let frame = null;
    let clock = 0;
    let last = performance.now();
    const draw = (now) => {
      if (!held?.current) clock += (now - last) * latest.current.pace;
      last = now;
      paint(context, loadout, latest.current, clock);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [loadout, held]);
  return <canvas ref={canvas} aria-hidden className={css.doll} data-doll={loadout.name} data-facing={mirrored ? 'left' : 'right'}
                 width={REACH * 2 * SCALE} height={CANVAS.height * SCALE}/>;
};

export default StoryDoll;

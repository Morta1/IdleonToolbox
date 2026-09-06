// Pure paper-doll math. The game draws a player as separate actors sharing one anchor (the body
// origin, at the feet). Every rule here mirrors the game's frame selection; see the spec's
// "Verified sprite facts" table. No DOM, no React: PaperDollCanvas.jsx does the drawing.

// How far above the feet a player layer can reach, in sprite px: the spear attack sheet's swing
// (weapon/2a.png, dy -100 at tick 0), measured by sweeping every pose the page can select (POSES,
// with 'attack' resolved through attackPoseForType), every weapon type, cape and costume in the
// shipped manifest through resolveLayers. Not a drawing input, only the top half of the canvas-fit
// test and the anchorY/height derivation below.
export const PLAYER_REACH_UP = 100;
// The anchor is deliberately off-centre. A companion only ever stands to the RIGHT of the player,
// so a centred anchor spends half the canvas on empty space: the player's own layers reach 76
// sprite px left of the feet at the very most, while the widest companion reaches 98 px right of
// it (r0d, origin 84 at half scale). anchorY leaves 4px above the attack swing's own top edge and
// the 30px the label needs below.
export const CANVAS = { width: 220, height: PLAYER_REACH_UP + 4 + 30, anchorX: 100, anchorY: PLAYER_REACH_UP + 4 };
// How far left of the anchor a player layer can reach, in sprite px: the spear attack sheet's own
// frame edge (dx -75.5), measured over every pose, weapon and cape against the shipped manifest.
// Not a drawing input, only the left half of the canvas-fit test.
export const PLAYER_REACH_LEFT = 76;
// The follower is a monster actor at scale 1 while the player runs at scale 2, so in this canvas's
// sprite-px space (world / 2) it draws at half size, and it is mirrored (realScaleX -1) so it
// faces the player. Its origin sits 112 world px right of the player's, feet on the same line.
// Measured in the live game; the follower placement code itself was not extracted.
export const COMPANION_SCALE = 0.5;
export const COMPANION_DX = 56;
// Every layer anchors by its own sheet origin now (see anchored() below), so the hat sheet's own
// origin already centers it on the body (30-wide frame, origin at 15 = its own horizontal center).
// HAT_OFFSET is only a pixel nudge added on top of that; currently zero.
export const HAT_OFFSET = { x: 0, y: 0 };
const ATTACK_POSES = new Set(['2a', '2b', '2c', '2_']);
const ATTACK_BY_TYPE = { SPEAR: '2a', BOW: '2b', WAND: '2c', FISTICUFF: '2_' };

// An empty weapon slot swings the fists sheet, which is what the game draws for a bare-handed
// player regardless of class.
export const attackPoseForType = (weaponType) => ATTACK_BY_TYPE[weaponType] ?? '2_';

// Pose labels 3-9 are the game's skilling animations (body group 21). Verified in the game
// controller code (not eyeballed off the sprite sheets): `3` is set when a map connection has
// type 0 (a jump), `4` when a map connection has type 1 (a ladder, i.e. climbing), `5` on a
// mining target, `6` on a Tree target (choppin), `7` on a Fish target (fishing), `8` on a Bug
// target (catching), and `9` when the player is on node 20 (the divinity/worship node).
export const POSES = [
  { id: '0', label: 'Idle' },
  { id: '1', label: 'Walk' },
  { id: 'attack', label: 'Attack' },
  { id: '3', label: 'Jump' },
  { id: '4', label: 'Climb' },
  { id: '5', label: 'Mining' },
  { id: '6', label: 'Choppin' },
  { id: '7', label: 'Fishing' },
  { id: '8', label: 'Catching' },
  { id: '9', label: 'Divinity' }
];

// The page keeps the three poses a look is judged by: standing, walking and the weapon swing.
// The skilling poses belong to the sheets, not to a wardrobe preview.
const OUTFIT_POSE_IDS = ['0', '1', 'attack'];
export const OUTFIT_POSES = OUTFIT_POSE_IDS.map((id) => POSES.find((pose) => pose.id === id));

// Real manifests carry 5000-10000ms "hold" frame durations (e.g. body/2_ has two 10s holds) that
// mark sub-animation boundaries for the game's own state machine; the game jumps straight over
// them instead of actually pausing on that frame for 10 seconds. A doll that honored the raw
// duration would appear to freeze, so every duration is clamped before it drives playback.
export const MAX_FRAME_MS = 500;
export const playbackDurations = (durations) => durations.map((d) => Math.min(d, MAX_FRAME_MS));

export const frameAt = (durations, elapsedMs, loop = true) => {
  const total = durations.reduce((sum, d) => sum + d, 0);
  if (total <= 0) return 0;
  let t = elapsedMs;
  if (loop) t = ((t % total) + total) % total;
  else if (t >= total) return null;
  for (let i = 0; i < durations.length; i++) {
    if (t < durations[i]) return i;
    t -= durations[i];
  }
  return durations.length - 1;
};

const drawOp = (sheet, frame, dx, dy) => ({
  file: sheet.file,
  sx: (frame % sheet.across) * sheet.frameW,
  sy: Math.floor(frame / sheet.across) * sheet.frameH,
  w: sheet.frameW,
  h: sheet.frameH,
  dx,
  dy
});

const anchored = (sheet) => ({ dx: -sheet.originX, dy: -sheet.originY });

// The game grows every player actor to scale 2 (`_PlayerSize` 200, `growTo(2, 2)`), and each actor
// scales around its OWN sprite origin. The actor coordinates and the game's offset tables
// (weaponOffsets, capeOffsets, the idle and walk bobs) are world pixels applied to the unscaled
// top-left, so a raw offset only lands right in sprite pixels once the origin pivot is undone:
//   offset = (raw + (layerOrigin - bodyOrigin) * (1 - S)) / S
// Live 2.3.528 check on '2a': body 94x50 origin (47, 50) at (859, 674), weapon 152x110 origin
// (76, 110) at (831, 634) - raw (-28, -40) renders as (-28.5, -50) sprite px. Layers that share the
// body's frame size and origin (idle/walk/climb weapon, cape, costume) reduce to raw / 2. Results
// stay fractional on purpose: the canvas draws at 3x and drawImage takes fractions.
export const GAME_SCALE = 2;
export const scaledOffset = (rawX, rawY, layerSheet, bodySheet) => ({
  dx: (rawX + (layerSheet.originX - bodySheet.originX) * (1 - GAME_SCALE)) / GAME_SCALE,
  dy: (rawY + (layerSheet.originY - bodySheet.originY) * (1 - GAME_SCALE)) / GAME_SCALE
});

// Per-pose z order, mirroring the game's own actor depth rules: the cape sits at
// min(body, weapon) - 1, except on '4' (climb) where it is max(body, weapon) + 1; the weapon sits
// at body - 1 when drawn from sheet '0' (poses '0' and '1') unless it is a FISTICUFF, and at body + 1
// everywhere else; the costume sits at body + 1, and at cape - 1 on '4'; the hat is an image attached
// to the body, so it is always drawn immediately after it.
// Game rule (from weapon actor's animation check): "0" == weapon.getAnimation() => non-FISTICUFF: z = body - 1, FISTICUFF: body + 1.
const DRAW_ORDER_IDLE_ARMED = ['cape', 'weapon', 'body', 'hat', 'costume'];
const DRAW_ORDER_DEFAULT = ['cape', 'body', 'hat', 'costume', 'weapon'];
const DRAW_ORDER_CLIMB = ['body', 'hat', 'weapon', 'costume', 'cape'];

export const drawOrder = (pose, weapon) => {
  if (pose === '4') return DRAW_ORDER_CLIMB;
  // Weapon behind body when drawn from sheet '0' (poses '0' and '1') with non-FISTICUFF type.
  if ((pose === '0' || pose === '1') && weapon && weapon.Type !== 'FISTICUFF') return DRAW_ORDER_IDLE_ARMED;
  return DRAW_ORDER_DEFAULT;
};

// On idle the game's weapon actor rides the body's own bob: +2px on body frames 0, 3 and 4 for
// every weapon type, except FISTICUFF which bobs on frames 0, 1 and 4 instead. Hardcoded here
// because the game hardcodes it too (the frame numbers are literals in the weapon actor's chain),
// unlike the flat per-animation offsets, which are parsed into manifest.weaponOffsets.
const IDLE_BOB_FRAMES = [0, 3, 4];
const IDLE_BOB_FRAMES_FISTICUFF = [0, 1, 4];
const idleWeaponBob = (type, bodyFrame) => {
  const frames = type === 'FISTICUFF' ? IDLE_BOB_FRAMES_FISTICUFF : IDLE_BOB_FRAMES;
  return frames.includes(bodyFrame) ? 2 : 0;
};

// Walking lifts the weapon with the stride: -4 world px on the first two body frames, -2 on the
// third, level after that.
const walkWeaponBob = (bodyFrame) => {
  if (bodyFrame < 2) return -4;
  return bodyFrame === 2 ? -2 : 0;
};

// Which weapon sheet a body pose draws, and the game's own world-pixel bob on top of the flat
// per-animation offset. Walk and climb reuse the idle sheet's layout (frame = type offset + ID);
// attacks index their own sheet by weapon block. Every other pose draws nothing: '3', 'Da' and
// 'Za' carry no weapon, and '5'..'9' show the tool from the tools slot, which this page has no
// slot for. Empty fists are simply not drawn while walking, so they are hidden, not unsupported.
export const weaponPlacement = (pose, type, bodyFrame) => {
  if (pose === '0') return { sheet: '0', byType: true, bob: idleWeaponBob(type, bodyFrame) };
  if (pose === '1') return type === 'FISTICUFF' ? null : { sheet: '0', byType: true, bob: walkWeaponBob(bodyFrame) };
  if (pose === '4') return { sheet: '4', byType: true, bob: 0 };
  if (ATTACK_POSES.has(pose)) return { sheet: pose, byType: false, bob: 0 };
  return null;
};

export const resolveLayers = (manifest, state, tick) => {
  const ops = {};
  const unsupported = [];
  const bodySheets = manifest.layers.body;
  const pose = bodySheets[state.pose] ? state.pose : '0';
  const body = bodySheets[pose];
  // A game update can rename/drop a body animation before the manifest catches up (or a caller
  // can hand in a manifest missing '0' entirely); with no body sheet there is nothing to anchor
  // any other layer to, so draw nothing rather than throw.
  if (!body) return { layers: [], unsupported: [] };
  const bodyFrame = frameAt(playbackDurations(body.durations), tick) ?? 0;
  // The body frame's top-left. The game places the weapon and the cape relative to this, not to
  // their own sheet origins.
  const bodyTopLeft = anchored(body);

  // The companion is its own actor standing beside the player, on its own animation clock and
  // behind every player layer.
  if (state.companion) {
    const sheet = manifest.layers.companion?.[state.companion.rawName];
    if (sheet) {
      const frame = frameAt(playbackDurations(sheet.durations), tick) ?? 0;
      // dx/dy describe the op's top-left AFTER the half scale and the mirror: flipping swaps the
      // origin's distance from the frame's left edge for its distance from the right one.
      const dx = COMPANION_DX - (sheet.frameW - sheet.originX) * COMPANION_SCALE;
      ops.companion = { ...drawOp(sheet, frame, dx, -sheet.originY * COMPANION_SCALE), drawScale: COMPANION_SCALE, flip: true };
    } else unsupported.push(state.companion.rawName);
  }

  if (state.cape) {
    const sheet = manifest.layers.cape[String(state.cape.ID)];
    if (sheet) {
      // CustomMaps.XYoffsetCape, indexed by the BODY's frame (the game reads the player's current
      // frame, not the cape's); the cape sheet's own frame still comes from its own loop.
      const offset = manifest.capeOffsets?.[pose];
      const frame = frameAt(playbackDurations(sheet.durations), tick) ?? 0;
      // World pixels again, so the scale-2 pivot has to come off (most cape sheets share the body's
      // geometry, which makes this a plain halving; a few are taller and do not).
      const shift = scaledOffset(offset?.x?.[bodyFrame] ?? 0, offset?.y?.[bodyFrame] ?? 0, sheet, body);
      ops.cape = drawOp(sheet, frame, bodyTopLeft.dx + shift.dx, bodyTopLeft.dy + shift.dy);
    } else unsupported.push(state.cape.rawName);
  }

  ops.body = drawOp(body, bodyFrame, bodyTopLeft.dx, bodyTopLeft.dy);

  if (state.costume) {
    const sheet = manifest.layers.costume[String(state.costume.ID)];
    // The costume sheet is not the body sheets concatenated: the game's shirt actor holds one
    // hardcoded base frame per body animation and adds the body's current frame to it.
    const base = manifest.costumeFrameBase?.[pose];
    const frame = Number.isFinite(base) ? base + bodyFrame : null;
    if (sheet && frame != null && frame < sheet.numFrames) {
      const costumeAnchor = anchored(sheet);
      ops.costume = drawOp(sheet, frame, costumeAnchor.dx, costumeAnchor.dy);
    } else unsupported.push(state.costume.rawName);
  }

  const placement = state.weapon ? weaponPlacement(pose, state.weapon.Type, bodyFrame) : null;
  if (placement) {
    const sheet = manifest.layers.weapon[placement.sheet];
    const { ID, Type } = state.weapon;
    let frame = null;
    if (sheet && !placement.byType) {
      const block = Type === 'FISTICUFF' ? ID : ID - 1;
      frame = bodyFrame + block * body.numFrames;
    } else if (sheet) {
      const typeOffset = manifest.weaponTypeOffsets[Type];
      frame = typeOffset == null ? null : typeOffset + ID;
    }
    if (frame != null && frame >= 0 && frame < sheet.numFrames) {
      // The weapon actor is placed at the player's top-left plus a flat per-animation offset
      // (manifest.weaponOffsets, parsed from the game's weapon chain) and the pose's bob, never at
      // its own origin: attack sheets are much larger than the body frame and would otherwise swing
      // below the feet. Both tables are world pixels, so scaledOffset undoes the scale-2 pivot.
      const offset = manifest.weaponOffsets?.[pose];
      const shift = scaledOffset((offset?.dx ?? 0), (offset?.dy ?? 0) + placement.bob, sheet, body);
      ops.weapon = drawOp(sheet, frame, bodyTopLeft.dx + shift.dx, bodyTopLeft.dy + shift.dy);
    } else unsupported.push(state.weapon.rawName);
  }

  if (state.hat) {
    const sheet = manifest.layers.hat[pose === '4' && manifest.layers.hat['4'] ? '4' : '1'];
    const frame = state.hat.ID + manifest.hatFrameOffset;
    if (sheet && frame < sheet.numFrames) {
      const hatAnchor = anchored(sheet);
      // The game's helmet actor nudges the hat per body frame (AnimationOffsets table); a pose
      // with no entry (e.g. skilling poses, or a game update that dropped a branch) gets no nudge.
      const nudge = manifest.hatOffsets?.[pose];
      const dx = hatAnchor.dx + (nudge?.x[bodyFrame] ?? 0) + HAT_OFFSET.x;
      const dy = hatAnchor.dy + (nudge?.y[bodyFrame] ?? 0) + HAT_OFFSET.y;
      ops.hat = drawOp(sheet, frame, dx, dy);
    } else unsupported.push(state.hat.rawName);
  }

  const layers = drawOrder(pose, state.weapon).map((name) => ops[name]).filter(Boolean);
  if (ops.companion) layers.unshift(ops.companion);
  return { layers, unsupported };
};
